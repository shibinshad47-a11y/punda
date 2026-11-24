'use client';

// WebRTC STUN/TURN ICE Servers configuration
export const getIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  // Optional TURN server from environment variables
  if (process.env.NEXT_PUBLIC_TURN_SERVER_URL) {
    servers.push({
      urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_PASSWORD,
    });
  }

  return servers;
};

export interface CallSignalPayload {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-ended' | 'call-declined';
  senderId: string;
  targetId?: string;
  conversationId?: string;
  callType: 'voice' | 'video';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream, peerId: string) => void) | null = null;
  private onSignalSendCallback: ((payload: CallSignalPayload) => void) | null = null;

  init(
    onRemoteStream: (stream: MediaStream, peerId: string) => void,
    onSignalSend: (payload: CallSignalPayload) => void
  ) {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onSignalSendCallback = onSignalSend;
  }

  async getLocalMedia(type: 'voice' | 'video'): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.localStream = stream;
    return stream;
  }

  createPeerConnection(peerId: string, currentUserId: string, callType: 'voice' | 'video'): RTCPeerConnection {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId)!;
    }

    const pc = new RTCPeerConnection({ iceServers: getIceServers() });

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.onSignalSendCallback) {
        this.onSignalSendCallback({
          type: 'ice-candidate',
          senderId: currentUserId,
          targetId: peerId,
          callType,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (event.streams[0] && this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(event.streams[0], peerId);
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  async createOffer(peerId: string, currentUserId: string, callType: 'voice' | 'video'): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection(peerId, currentUserId, callType);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (this.onSignalSendCallback) {
      this.onSignalSendCallback({
        type: 'offer',
        senderId: currentUserId,
        targetId: peerId,
        callType,
        sdp: offer,
      });
    }

    return offer;
  }

  async handleOffer(
    peerId: string,
    currentUserId: string,
    callType: 'voice' | 'video',
    sdp: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const pc = this.createPeerConnection(peerId, currentUserId, callType);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (this.onSignalSendCallback) {
      this.onSignalSendCallback({
        type: 'answer',
        senderId: currentUserId,
        targetId: peerId,
        callType,
        sdp: answer,
      });
    }

    return answer;
  }

  async handleAnswer(peerId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => (track.enabled = enabled));
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => (track.enabled = enabled));
    }
  }

  cleanup() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}
