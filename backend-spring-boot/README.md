# Tiplet Enterprise Java Spring Boot Backend

This directory contains the complete, production-ready **Java Spring Boot Backend Blueprint** for the Tiplet platform. It is fully pre-configured to align perfectly with the React frontend's enterprise API layer (`src/services/api.ts`).

---

## 🏗️ Project Architecture

```text
backend-spring-boot/
├── pom.xml                                  # Maven dependencies (Spring Boot, JPA, Stripe, PostgreSQL, Lombok)
├── README.md                                # Setup and developer instructions
└── src/
    └── main/
        ├── java/
        │   └── com/
        │       └── tiplet/
        │           └── api/
        │               ├── TipletApplication.java          # Application bootstrap entrypoint
        │               ├── config/
        │               │   └── CorsConfig.java             # Enterprise CORS mapping configuration
        │               ├── controller/
        │               │   ├── AuthController.java         # Passwordless authentication & registration REST endpoints
        │               │   ├── CheckoutController.java     # Stripe & simulation checkout session endpoints
        │               │   ├── CreatorController.java      # Public profile & support tip delivery
        │               │   └── DashboardController.java    # Authenticated settings & stats endpoints
        │               ├── model/
        │               │   ├── Creator.java                # JPA Entity representing a Tiplet Creator
        │               │   ├── Tip.java                    # JPA Entity representing a Support Tip/Donation
        │               │   └── WidgetSettings.java         # JPA Entity representing Creator Widget Settings
        │               └── repository/
        │                   ├── CreatorRepository.java      # JPA Repository for Creator DB queries
        │                   ├── TipRepository.java          # JPA Repository for Tip DB queries
        │                   └── WidgetSettingsRepository.java# JPA Repository for WidgetSettings DB queries
        └── resources/
            └── application.properties       # Spring Boot application configuration properties
```

---

## 🚀 Getting Started (Run the Spring Boot Backend)

### Prerequisites
- **Java JDK 17** or higher
- **Maven 3.6+**
- **PostgreSQL Database** running locally or in the cloud

### Step 1: Configure application.properties
Edit `src/main/resources/application.properties` and provide your database configurations:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5412/tiplet
spring.datasource.username=postgres
spring.datasource.password=your_secure_password

# Stripe Integration Credentials
stripe.api.key=sk_test_...
stripe.webhook.secret=whsec_...
```

### Step 2: Build and Run
Using your terminal, navigate to this directory and run:
```bash
# Build the application
mvn clean package

# Run the boot executable
java -jar target/tiplet-api-0.0.1-SNAPSHOT.jar
```
The backend server will launch seamlessly on `http://localhost:8080`.

---

## 🔌 Connecting the React Frontend

To direct the React frontend to point to this Spring Boot backend:

### Option A: Development Environment Variable (Recommended)
Add the following line to your React workspace `.env` or `.env.local` file:
```env
VITE_API_BASE_URL=http://localhost:8080
```
Our enterprise API client layer (`src/services/api.ts`) will automatically prefix all request paths with this origin.

### Option B: Production Static Build Delivery
Spring Boot can serve your React static files directly in production:
1. Run `npm run build` in the React workspace to produce the `dist` folder.
2. Copy the contents of the `dist` folder to `/src/main/resources/static` in the Spring Boot project.
3. Access the entire application directly on port `8080` (CORS will be bypassed automatically since they share the same origin).
