# PawFile

A pet profile and health tracker web app for pet owners who want a simple way to manage their pet's records, vet visits, vaccinations, and more.

## What It Does

PawFile lets pet owners create profiles for their pets and keep all health-related information in one place. No more digging through phone galleries for vaccination photos or forgetting when the last vet visit was.

### Core Features

**Pet Profiles**
- Add multiple pets per account
- Basic info: name, breed, species, birthday, weight, photo
- Shareable public profile page (optional)

**Health Records**
- Log vet visits with date, clinic name, vet name, notes, and diagnosis
- Track vaccinations with due dates and reminders
- Record medications (name, dosage, frequency, start/end dates)
- Upload documents or photos (lab results, prescriptions)

**Reminders**
- Vaccination schedule reminders
- Medication reminders
- Upcoming vet appointment alerts
- Grooming schedule

**Timeline View**
- Chronological feed of all events for a pet
- Filter by type (vet visit, vaccination, medication, grooming)

### Future/Nice-to-Have Features

- Nearby vet and grooming shop directory
- Multi-user access (family members sharing a pet profile)
- Export records as PDF
- Weight and health trend charts
- Expense tracking per pet

## Tech Stack

| Layer        | Tool                          |
|------------- |-------------------------------|
| Framework    | Nuxt 3                        |
| UI           | Nuxt UI                       |
| Database     | MongoDB (via Mongoose)        |
| Auth         | TBD (Nuxt Auth Utils / Clerk) |
| File Storage | TBD (Cloudflare R2 / Supabase Storage) |
| Hosting      | Vercel / Cloudflare Pages     |
| DB Hosting   | MongoDB Atlas (free tier)     |

## Project Structure

```
pawfile/
├── app/
│   ├── pages/
│   │   ├── index.vue                 # Landing page
│   │   ├── login.vue
│   │   ├── register.vue
│   │   ├── dashboard.vue             # User's pet list
│   │   └── pets/
│   │       ├── [id].vue              # Pet profile page
│   │       ├── [id]/
│   │       │   ├── health.vue        # Health records
│   │       │   ├── timeline.vue      # Event timeline
│   │       │   └── edit.vue          # Edit pet info
│   │       └── new.vue               # Add new pet
│   ├── components/
│   │   ├── pet/
│   │   │   ├── PetCard.vue
│   │   │   ├── PetForm.vue
│   │   │   └── PetAvatar.vue
│   │   ├── health/
│   │   │   ├── VetVisitForm.vue
│   │   │   ├── VaccinationForm.vue
│   │   │   ├── MedicationForm.vue
│   │   │   └── RecordCard.vue
│   │   └── common/
│   │       ├── ReminderBadge.vue
│   │       └── TimelineItem.vue
│   └── layouts/
│       ├── default.vue
│       └── auth.vue
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts
│   │   │   ├── register.post.ts
│   │   │   └── me.get.ts
│   │   ├── pets/
│   │   │   ├── index.get.ts          # List user's pets
│   │   │   ├── index.post.ts         # Create pet
│   │   │   ├── [id].get.ts           # Get pet by ID
│   │   │   ├── [id].put.ts           # Update pet
│   │   │   └── [id].delete.ts        # Delete pet
│   │   ├── health/
│   │   │   ├── vet-visits.post.ts
│   │   │   ├── vaccinations.post.ts
│   │   │   ├── medications.post.ts
│   │   │   └── [petId].get.ts        # Get all records for a pet
│   │   └── reminders/
│   │       ├── index.get.ts
│   │       └── index.post.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── pet.model.ts
│   │   ├── health-record.model.ts
│   │   └── reminder.model.ts
│   ├── services/
│   │   ├── pet.service.ts
│   │   ├── health.service.ts
│   │   └── reminder.service.ts
│   └── utils/
│       ├── db.ts                     # Mongoose connection
│       └── auth.ts                   # Auth helpers
├── public/
├── nuxt.config.ts
├── package.json
└── README.md
```

## Data Models (High Level)

### User
- email
- password (hashed)
- name
- createdAt

### Pet
- userId (owner reference)
- name
- species (dog, cat, bird, etc.)
- breed
- birthday
- gender
- weight
- photo (URL)
- isPublic (shareable profile toggle)
- createdAt

### HealthRecord
- petId
- type (vet_visit | vaccination | medication | grooming | other)
- date
- title
- notes
- metadata (flexible, varies by type):
  - vet_visit: clinicName, vetName, diagnosis, followUpDate
  - vaccination: vaccineName, batchNumber, nextDueDate
  - medication: medicationName, dosage, frequency, startDate, endDate
  - grooming: groomingType, groomerName
- attachments (array of file URLs)
- createdAt

### Reminder
- petId
- userId
- type (vaccination | medication | appointment | grooming)
- title
- dueDate
- isCompleted
- relatedRecordId (optional link to a health record)
- createdAt

## Monetization Ideas

- **Free tier**: up to 2 pets, basic health records
- **Premium** (around 99-149 PHP/month): unlimited pets, file uploads, reminders, PDF export, family sharing
- **Freemium add-ons**: vet directory featured listings (charge vets/groomers for visibility)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in MONGODB_URI, auth secrets, file storage keys

# Run dev server
npm run dev
```

## MVP Scope

For the initial launch, focus on:

1. User registration and login
2. CRUD for pet profiles (with photo upload)
3. Add and view health records (vet visits and vaccinations first)
4. Basic timeline view
5. Simple reminder system (in-app, no push notifications yet)

Everything else can come after you have real users giving feedback.
