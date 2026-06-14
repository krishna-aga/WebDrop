# WebDrop API Documentation

This document describes the REST API endpoints and Socket.io events exposed by the WebDrop signaling server (`apps/server`).

## REST API

### 1. Create Room
Generates a new, unique room ID and a shareable URL for the receiver.

- **URL:** `/api/create-room`
- **Method:** `POST`
- **Headers:** None required.
- **Body:** None required.
- **Response:**
  - **Code:** `201 Created`
  - **Content:**
    ```json
    {
      "roomId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "shareUrl": "http://localhost:5173/receive/f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
    ```

### 2. Health Check
Returns the basic health status of the signaling server.

- **URL:** `/health`
- **Method:** `GET`
- **Response:**
  - **Code:** `200 OK`
  - **Content:**
    ```json
    {
      "status": "ok"
    }
    ```

---

## Socket.io Events

The signaling server communicates with the WebDrop frontend over WebSockets using `Socket.io`.

### Client-to-Server Events (Emitted by Frontend)

#### `join-room`
Sent by a client attempting to join a specific room. The first client to join is designated as the `sender`. The second client is the `receiver`. If a third client attempts to join, it will fail.
- **Payload:** `{ roomId: string }`
- **Acknowledgement Callback:** `(response: { success: boolean, error?: string }) => void`

#### `offer`
Sent by the sender client to initiate the WebRTC connection. This payload is strictly forwarded to the receiver.
- **Payload:** `{ roomId: string, offer: RTCSessionDescriptionInit }`

#### `answer`
Sent by the receiver client in response to an `offer`. This payload is strictly forwarded back to the sender.
- **Payload:** `{ roomId: string, answer: RTCSessionDescriptionInit }`

#### `ice-candidate`
Sent by either peer to negotiate the WebRTC connection. It is strictly forwarded to the *other* peer in the room.
- **Payload:** `{ roomId: string, candidate: RTCIceCandidateInit }`

### Server-to-Client Events (Listened by Frontend)

#### `room-joined`
Emitted by the server to confirm a successful room join. If the receiver joins, the server also emits this to the sender so the sender knows the receiver is ready.
- **Payload:** `{ role: "sender" | "receiver" }`

#### `offer`
Received by the receiver when the sender initiates the connection.
- **Payload:** `RTCSessionDescriptionInit`

#### `answer`
Received by the sender when the receiver accepts the connection.
- **Payload:** `RTCSessionDescriptionInit`

#### `ice-candidate`
Received by a peer when the other peer generates an ICE candidate.
- **Payload:** `RTCIceCandidateInit`

#### `peer-disconnected`
Emitted by the server to the remaining peer in a room if the other peer disconnects (e.g. closes their browser tab).
- **Payload:** None.

#### `error`
Emitted by the server when a generic unhandled exception occurs.
- **Payload:** `string` (Error message)
