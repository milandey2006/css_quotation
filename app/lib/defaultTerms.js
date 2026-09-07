// Selectable Terms & Conditions templates for quotations. Pick one from the
// dropdown in the quotation form to load it into the editable Terms box.
//
// Each line renders as one bullet on the Terms page. Keep the "Label:- text"
// shape — the preview bolds the part before the first ":" or "-".

// ---- Shared clauses reused across templates -------------------------------
const COMMON_COMMERCIAL_TERMS = `Payment Terms: 70% Advance with Confirmed Order and 30% After completion of Work
Validity Of Quote : 3 days from date of Quote
Site Survey & Visiting Charge:- Once the quotation is approved and we are called for a site survey, a visiting charge is applicable. If the order is confirmed, this visiting charge will be adjusted / deducted in the final invoice.
GST & Taxes:- All prices are exclusive of GST. Applicable taxes will be charged extra at actuals.
Material Delivery Lead Time:- Material delivery lead time is approximately 2 weeks after order confirmation.
Freight Charges:- Freight charges will be extra if the product is dispatched by transport. For local deliveries, no extra freight charges are applied.
Order Cancellation:- Advance is non-refundable once the order is confirmed and material has been procured.
Our responsibility ceases the moment the good leave our premises and no claim of breakage, etc would be accepted.
AMC:- Annual Maintenance Contract (AMC) is available at additional cost after the warranty period.
Force Majeure:- We shall not be held liable for any delay or failure caused by circumstances beyond our reasonable control.
Complain will be received by Email:- <a href="mailto:support@championsecuritysystem.com" class="text-blue-600 underline">support@championsecuritysystem.com</a> with detail (like device number, place etc).
Time:- 10:30am To 6:30pm
Service will be provided in 24 to 48 hours after call received by Authorized Person
Jurisdiction:- All disputes are subject to the exclusive jurisdiction of the courts at Mumbai, Maharashtra.`;

// ---- CCTV / Surveillance ---------------------------------------------------
const CCTV_TERMS = `Device warranty :- Five year warranty all /5MP cameras and NVR
Warranty: Hard Disk warranty for Two years, All POE switch warranty one years from date of supply subject to manufacturing defects only.
Cable :- Cable will be On Actual, it will be not in warranty in case of Damage. It's based on final installation it could be more or less than the estimated cable length
Recording :- Recording will be supported upto 20 Days. In case of hard disk failure, we shall not be held responsible for any loss of recorded data.
Service & Support:- One Year service & support will be provided on call basis.
Completion Time:- The exact completion time will be confirmed after the site survey, based on the actual scope of work.
Scope of Client :- customer will providing ladder and etc for working accessories proper power source to the equipments, Civil, Carpentry, Fabrication work is in the scope of client
Installation Timeline:- Installation shall commence after receipt of advance and site readiness; the exact duration will be confirmed after the site survey.
Site Readiness:- Client to provide clear site access, 230V power points near each device/DVR/NVR location, and all civil, carpentry and fabrication work before installation.
Power Backup:- UPS / power backup for the system is not included unless specifically mentioned in the quotation.
Remote Viewing:- Mobile / remote viewing requires a stable broadband internet connection with adequate upload speed, to be arranged by the client.
Recording Backup:- Recording days are approximate and vary with camera resolution, frame rate, motion and scene activity.
Warranty Exclusions:- Warranty does not cover damage due to lightning, power surge, water ingress, fire, rodents, physical or accidental damage, or mishandling.
Cabling:- Standard cabling is carried out via surface conduit / casing-capping. Concealed, underground or false-ceiling routing, if required, is chargeable extra.
Height & Safety:- Work above 10 ft requires scaffolding / ladder / safety arrangement to be provided by the client.
Data & Privacy:- Responsibility for recorded footage, its storage and lawful use rests solely with the client.
${COMMON_COMMERCIAL_TERMS}`;

// ---- Biometric / Access Control -------------------------------------------
const BIOMETRIC_TERMS = `Device Warranty:- One year warranty on all biometric devices and controllers from date of supply, subject to manufacturing defects only.
Lock & Hardware Warranty:- EM locks, drop bolts, door strikes and exit switches carry a six-month warranty against manufacturing defects.
Software:- Access control / attendance software license is provided as per the quotation. Software updates and re-installation after the warranty period are chargeable.
User Enrollment:- Enrollment of fingerprints / faces / cards for the initial batch of users is included. Bulk or repeat enrollment thereafter is to be handled by the client or is chargeable.
Door Hardware Scope:- EM locks, power supply, exit buttons, break-glass units and door accessories are supplied only as listed in the quotation.
Door Preparation:- Drilling, cutting, glass fixing, framework and any civil / carpentry / fabrication work required at the door is in the scope of the client.
Power Backup:- Backup battery / UPS for the access control system is not included unless specifically mentioned in the quotation.
Network:- LAN / network points near each controller for networked devices are to be provided by the client.
Cabling:- Standard cabling is carried out via surface conduit / casing-capping. Concealed, underground or false-ceiling routing, if required, is chargeable extra.
Integration:- Integration with existing doors, turnstiles, lifts, payroll or third-party software is subject to compatibility and may be chargeable.
Data & Privacy:- Responsibility for enrolled biometric / attendance data, its storage and lawful use rests solely with the client.
Warranty Exclusions:- Warranty does not cover damage due to lightning, power surge, water ingress, fire, physical or accidental damage, tampering or mishandling.
Service & Support:- One Year service & support will be provided on call basis.
Completion Time:- The exact completion time will be confirmed after the site survey, based on the actual scope of work.
Installation Timeline:- Installation shall commence after receipt of advance and site readiness; the exact duration will be confirmed after the site survey.
${COMMON_COMMERCIAL_TERMS}`;

// ---- Templates map (drives the dropdown) ----------------------------------
export const TERMS_TEMPLATES = [
  { key: 'cctv', label: 'CCTV / Surveillance', terms: CCTV_TERMS },
  { key: 'biometric', label: 'Biometric / Access Control', terms: BIOMETRIC_TERMS },
];

export const getTermsTemplate = (key) =>
  (TERMS_TEMPLATES.find((t) => t.key === key) || TERMS_TEMPLATES[0]).terms;

// Backward-compatible default used for a new quotation's initial terms.
export const DEFAULT_QUOTATION_TERMS = CCTV_TERMS;
