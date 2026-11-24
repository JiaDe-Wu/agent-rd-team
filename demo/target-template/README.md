# Event Sign-up Site

## Requirement

Build a small website where organisers publish events and attendees sign up.

1. The home page lists all events: name, time, place and the places left.
2. Open an event to see its details, and sign up with a name and an email address.
3. Sign-up is validated: the name cannot be empty; the email address must be well formed; a full event cannot be signed up for; the same email address cannot sign up for the same event twice. When a sign-up fails, tell the person why.
4. An organiser can see the list of people who signed up for an event.
5. The pages also work on a phone.

## Constraints

- The backend and the frontend are separate: the backend is in `backend/`, the frontend is in `frontend/`, and the frontend gets its data only over the HTTP API.
- No dependencies: use only the modules that come with Node 22 and install no npm packages.
- Data is kept in memory first; it may be lost when the server restarts.
- `npm start` starts the server, which serves both the API and the frontend pages: the port is the environment variable `PORT` (default 3000), and it listens only on the address in the environment variable `HOST` (default `127.0.0.1`).
- `npm test` runs every `*.test.js` under `tests/` with `node --test`; each test name starts with the number of an acceptance criterion, for example `AC-3: a full event cannot be signed up for`.
