# POC Scope — AI Receptionist

## Goal
Build a working demo that gets a service business to say "I want this." The demo shows the full loop: a customer calls or texts → Alex handles it → the business owner sees the lead in their dashboard instantly.

## Target Audience for POC
Home service businesses: plumbers, HVAC, fence companies, cleaners, contractors, electricians.

## The Demo Script
1. Vijay calls the demo number as a "customer" needing a job done
2. Alex picks up, handles the inquiry, captures info, logs the lead
3. Vijay shows the business owner their secret dashboard link — the lead appeared live
4. Business owner gets their own number + knowledge base for a 2-week trial
5. If they want to proceed → Vijay flips them to a live account, billing begins manually

---

## IN SCOPE for POC

### Vijay's Admin Panel (only Vijay uses this)
- [ ] Create a new business (tenant)
- [ ] Enter business name + any combination of knowledge base sources (see below)
- [ ] Review and edit the auto-generated knowledge base before going live
- [ ] System provisions a dedicated Twilio number per business
- [ ] Generate a secret dashboard URL to share with the business owner
- [ ] Toggle business status: POC → Live

### Knowledge Base Sources (at least one required, any combination)
- [ ] Website URL — scraped automatically
- [ ] Google Maps URL — scraped automatically
- [ ] Facebook page URL — scraped automatically
- [ ] Yelp listing URL — scraped automatically
- [ ] Manual write-up — paste text or upload PDF / Word / plain text file

All sources are combined into one unified knowledge base per business.

### Alex — AI Receptionist
- [ ] Answers inbound voice calls (Twilio voice + text-to-speech)
- [ ] Responds to inbound SMS texts
- [ ] Uses business knowledge base to answer questions
- [ ] Captures leads: name, phone number, job description, timestamp, channel (call vs. text)
- [ ] Hands off cleanly when question is outside the knowledge base
- [ ] Configurable emergency protocol per business:
  - Capture and notify ("someone will call you back within the hour")
  - Give direct number ("for emergencies call [owner] at [number]")
  - Immediate SMS to owner
- [ ] Transparent about being an AI if asked directly
- [ ] Default persona name: Alex (customizable per business)

### Business Owner Dashboard (secret URL, no login)
- [ ] View all leads in real time
- [ ] Lead info: name, phone, job description, timestamp, channel (call/text)
- [ ] Real-time updates when new lead arrives

### Notifications
- [ ] SMS to business owner when new lead captured (toggleable)
- [ ] Email to business owner when new lead captured (toggleable)

---

## OUT OF SCOPE for POC

- Business owner login / auth
- Business owner self-serve signup
- Billing / payment processing / contracts (handled manually for now)
- Calendar sync (Google / Outlook)
- WhatsApp integration
- PWA / mobile app (web only for POC)
- Multi-staff / team management
- Customer-facing booking page
- Automated follow-up sequences
- Analytics / reporting
- Online presence features
- Business owner ability to edit their own knowledge base

---

## Data Captured Per Lead
- Customer name
- Customer phone number
- Job description (what they need)
- Timestamp
- Channel (voice call vs. SMS)

---

## Account States
- **POC** — trial, 2-week window, Vijay sets up and manages
- **Live** — converted after verbal yes, billing starts manually, account stays permanently

---

## Success Criteria
A prospect business owner, after a 15-minute demo, says:
> "Yes, I want to try this for my business."
