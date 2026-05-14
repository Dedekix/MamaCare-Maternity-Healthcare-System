# MamaCare Maternal Health Care Management System

MamaCare is a web-based maternal health care management system. It helps pregnant women, doctors, nurses, and administrators manage appointments, medical records, users, and care communication from one platform.

The project has two main parts:

- `MamaCareMaternalHealthCare/` - Spring Boot REST API backend
- `mamacare-frontend/` - React + Vite frontend

## What the System Does

MamaCare supports the main workflows needed in a maternal care setting:

- Users can register and log in by role: Mother, Doctor, Nurse, or Admin.
- Mothers can book and view appointments.
- Doctors, nurses, and admins can view clinical records.
- Doctors and admins can create medical records for mothers.
- Admin users can view the care network and manage users.
- The backend exposes APIs for users, appointments, medical records, messages, profiles, specializations, and locations.

## Main User Roles

| Role | Main Access |
| --- | --- |
| Mother | Login, dashboard, appointments, booking |
| Doctor | Dashboard, appointments, medical records, new records |
| Nurse | Dashboard, appointments, medical records |
| Admin | Dashboard, appointments, medical records, users/care network |

The frontend protects pages based on the logged-in user saved in browser `localStorage`.

## Technology Stack

### Backend

- Java 21
- Spring Boot 4
- Spring Web / Web MVC
- Spring Data JPA
- PostgreSQL
- Maven

### Frontend

- React 19
- Vite
- React Router
- Axios
- CSS theme in `src/styles/mamacare-theme.css`

## Project Structure

```text
MamaCareMaternalHealthCare/
|-- README.md
|-- MamaCareMaternalHealthCare/
|   |-- pom.xml
|   `-- src/main/
|       |-- java/MamaCareMaternalHealthCare/
|       |   |-- controller/     REST API controllers
|       |   |-- dto/            Request objects for login and registration
|       |   |-- model/          JPA entities and enums
|       |   |-- repository/     Spring Data repositories
|       |   |-- service/        Business logic
|       |   `-- config/         CORS configuration
|       `-- resources/
|           `-- application.properties
`-- mamacare-frontend/
    |-- package.json
    `-- src/
        |-- components/         Shared UI and layout components
        |-- pages/              App pages
        |-- routes/             Route definitions
        |-- services/           API client
        |-- styles/             Theme CSS
        `-- utils/              Auth, roles, navigation, formatting
```

## How the Backend Works

The backend is a Spring Boot REST API. Controllers receive HTTP requests, services handle the business rules, repositories talk to PostgreSQL through JPA, and models define the database tables.

Important backend layers:

- `controller/` exposes endpoints such as `/api/users`, `/api/appointments`, and `/api/medical-records`.
- `service/` contains the logic for saving, updating, deleting, searching, sorting, and paginating records.
- `repository/` uses Spring Data JPA to query the database.
- `model/` contains entities such as `User`, `Appointment`, `MedicalRecord`, `Message`, `Profile`, and `Specialization`.

### Core Backend Models

| Model | Purpose |
| --- | --- |
| `User` | Stores account details, role, status, phone number, profile, and doctor specializations |
| `Appointment` | Stores appointment date/time, status, mother, and doctor |
| `MedicalRecord` | Stores diagnosis, prescription, record date, mother, and doctor |
| `Specialization` | Stores doctor specialization names |
| `Profile` | Stores extra user profile details |
| `Message` | Stores messages between users |
| `Location` | Backend location entity, available through API but not shown in the current frontend UI |

## Main API Endpoints

The frontend mainly uses the `/api/...` endpoints.

### Users

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/users` | Register a user |
| `POST` | `/api/users/login` | Login with email, password, and role |
| `GET` | `/api/users` | Get all users |
| `GET` | `/api/users/{id}` | Get user by ID |
| `GET` | `/api/users/role/{role}` | Get users by role |
| `PUT` | `/api/users/{id}` | Update user |
| `PUT` | `/api/users/approve/{id}` | Approve user |
| `DELETE` | `/api/users/{id}` | Delete user |

### Appointments

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/appointments` | Create appointment |
| `GET` | `/api/appointments` | Get all appointments |
| `GET` | `/api/appointments/{id}` | Get appointment by ID |
| `PUT` | `/api/appointments/{id}` | Update appointment |
| `DELETE` | `/api/appointments/{id}` | Delete appointment |
| `GET` | `/api/appointments/pagination` | Get paginated appointments |
| `GET` | `/api/appointments/sort/{field}` | Sort appointments |

### Medical Records

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/medical-records` | Add medical record |
| `GET` | `/api/medical-records` | Get all medical records |
| `GET` | `/api/medical-records/{id}` | Get record by ID |
| `PUT` | `/api/medical-records/{id}` | Update record |
| `DELETE` | `/api/medical-records/{id}` | Delete record |

### Specializations

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/specializations/save` | Create specialization |
| `GET` | `/api/specializations/all` | Get all specializations |
| `GET` | `/api/specializations/{id}` | Get specialization by ID |
| `PUT` | `/api/specializations/update/{id}` | Update specialization |
| `DELETE` | `/api/specializations/delete/{id}` | Delete specialization |

### Messages and Profiles

| Area | Example Endpoints |
| --- | --- |
| Messages | `/api/messages/send`, `/api/messages/received/{userId}`, `/api/messages/sent/{userId}` |
| Profiles | `/api/profiles/save`, `/api/profiles/all`, `/api/profiles/{id}` |

## Business and Technical Validations

The backend validates important workflows before saving data. Invalid technical input returns `400 Bad Request`. Duplicate email registration still returns a conflict response.

### User Registration and Login

| Validation Type | Rule |
| --- | --- |
| Technical | Registration details are required. |
| Technical | Full name must contain at least 2 characters. |
| Technical | Email is required, must be valid, and is stored in lowercase. |
| Technical | Password must contain at least 8 characters. |
| Technical | Role is required. |
| Technical | Optional phone number must contain 7 to 15 digits and may start with `+`. |
| Business | Email address must be unique. |
| Business | Doctor accounts must select at least one valid specialization. |
| Business | Login role must match the role stored for the account. |

### Appointments

| Validation Type | Rule |
| --- | --- |
| Technical | Appointment date and time are required. |
| Technical | Appointment date and time cannot be in the past. |
| Technical | Mother and doctor must both be selected. |
| Business | Selected mother must exist and have the `MOTHER` role. |
| Business | Selected doctor must exist and have the `DOCTOR` role. |
| Business | Mother and doctor must be different users. |
| Business | New appointments default to `PENDING` when no status is provided. |

### Medical Records

| Validation Type | Rule |
| --- | --- |
| Technical | Diagnosis is required and must contain at least 3 characters. |
| Technical | Record date is required. |
| Technical | Record date cannot be in the future. |
| Technical | Mother and doctor must both be selected. |
| Business | Medical records must be linked to an existing `MOTHER` user. |
| Business | Medical records must be linked to an existing `DOCTOR` user. |
| Technical | Diagnosis and prescription text are trimmed before saving. |

## How the Frontend Works

The frontend is a React single-page app. It uses React Router for navigation and Axios for API calls.

Important frontend files:

- `src/routes/AppRoutes.jsx` defines all routes.
- `src/services/api.js` defines the Axios client and backend API calls.
- `src/utils/auth.js` saves and reads the logged-in user from `localStorage`.
- `src/components/layout/AppShell.jsx`, `Sidebar.jsx`, and `Navbar.jsx` create the main authenticated layout.
- `src/pages/auth/Login.jsx` and `Register.jsx` handle authentication.
- `src/pages/dashboard/DashboardHome.jsx` shows role-specific dashboard summaries.
- `src/pages/appointments/` handles appointment listing and booking.
- `src/pages/medical/` handles medical records.
- `src/pages/network/CareNetworkPage.jsx` shows the admin user directory.

## Running the Project Locally

### Prerequisites

Install these first:

- Java 21
- Maven, or use the included `mvnw.cmd`
- Node.js and npm
- PostgreSQL

### 1. Create the Database

Create a PostgreSQL database:

```sql
CREATE DATABASE mamacare_db;
```

Then update the backend database settings in:

```text
MamaCareMaternalHealthCare/src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mamacare_db
spring.datasource.username=postgres
spring.datasource.password=<your-postgres-password>
spring.jpa.hibernate.ddl-auto=update
```

`ddl-auto=update` lets Hibernate create/update tables automatically while developing.

### 2. Start the Backend

From the backend folder:

```bash
cd MamaCareMaternalHealthCare
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd MamaCareMaternalHealthCare
.\mvnw.cmd spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

### 3. Start the Frontend

From the frontend folder:

```bash
cd mamacare-frontend
npm install
npm run dev
```

The frontend usually runs on:

```text
http://localhost:5173
```

If your backend is not on `http://localhost:8080`, create a frontend `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Common Development Commands

### Backend

```bash
./mvnw spring-boot:run
./mvnw test
./mvnw clean package
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
.\mvnw.cmd test
.\mvnw.cmd clean package
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Basic User Flow

1. Open the frontend.
2. Register as a Mother, Doctor, Nurse, or Admin.
3. Login with the same role used during registration.
4. Use the dashboard to navigate.
5. Book appointments from the appointment page.
6. Doctors, nurses, and admins can open medical records.
7. Admins can open the care network to see registered users.

## Notes for Developers

- Passwords are currently stored and compared directly in the database. For production, add password hashing with Spring Security or another secure authentication system.
- The frontend auth is localStorage-based and intended for a simple project workflow. For production, use proper server-issued sessions or JWTs.
- The backend contains location APIs, but the current frontend UI does not display location screens.
- Some endpoints have older alternate paths, such as `/appointments` and `/medicalRecord`; the frontend uses the newer `/api/...` paths.
- Keep real database passwords out of committed files when sharing the project.

## Build Check

To check the frontend production build:

```bash
cd mamacare-frontend
npm run build
```

To check backend compilation:

```bash
cd MamaCareMaternalHealthCare
./mvnw clean package
```
credentials
Admin
iradukundadelphine8@gmail.com
Iradukunda
Doctor
ingabire@example.com
Ingabire
ndagijimana@example.com
Ndagijimana
Pregnant woman
ishimwe@example.com
Ishimwe@123
chantal@example.com
Chantal123
Nurse
mukeshimana@example.com
Mukeshimana