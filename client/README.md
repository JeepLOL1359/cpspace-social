# CPSpace Client (Frontend)

This directory contains the frontend implementation of the CPSpace system.

The client is a web-based application responsible for user interaction, including:
- Emotion logging and diary features
- Anonymous social space browsing and posting
- Real-time UI updates
- Communication with backend services and Firebase

## Technology Stack
- Web frontend framework (React)
- Firebase SDK (Firestore, Authentication)
- Browser-based execution

## Responsibilities
- Render user interface
- Collect user input
- Send and receive data from Firestore
- Communicate with backend AI services via HTTP APIs

## Notes
- This directory contains only frontend-related code.
- No backend logic or AI processing is implemented here.
- Firebase configuration is loaded during frontend initialization.

The frontend and backend are intentionally separated to maintain clean dependency boundaries and modular system design.
