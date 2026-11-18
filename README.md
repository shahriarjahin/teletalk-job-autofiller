# Teletalk Job FastFiller 🇧🇩
> **Universal 1-Click Form Autofiller for Bangladesh Government Job Applications on Teletalk Portals**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local-blue.svg)](#-privacy--security)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Browser-Chrome%20%7C%20Edge%20%7C%20Brave-green.svg)](#-installation)

**Teletalk Job FastFiller** is a lightweight, open-source browser extension that automates tedious and repetitive form-filling across Bangladesh Government job circulars powered by the Teletalk recruitment engine.

Apply to government circulars in **under 3 seconds** without manually typing your educational, personal, and address details every single time!

---

## 🚀 Key Features

- **⚡ 1-Click Complete Auto-Fill**: Automatically fills 40+ form fields in less than a second.
- **⌨️ Keyboard Shortcut (`Alt + A`)**: Press `Alt + A` on any Teletalk job page to fill the application instantly.
- **🏷️ Floating In-Page Action Bar**: Non-intrusive floating pill `[⚡ Auto-Fill Application (Alt+A)]` and `[💾 Save Form]` directly on the page.
- **🧠 Smart Dynamic Upazila Resolver**: Detects Teletalk's asynchronous District AJAX requests and intelligently selects the correct Upazila / Thana after the dropdown populates.
- **🔄 Conditional Field Reveals**: Automatically triggers conditional inputs (National ID number, Birth Registration number, Passport number, Spouse name, GPA / CGPA spinbuttons).
- **🎓 Comprehensive Education Mapping**:
  - **SSC / Dakhil / Vocational**: Roll, Board, Group, GPA, Passing Year.
  - **HSC / Alim / Diploma / A Level**: Roll, Board, Group, GPA, Passing Year.
  - **Graduation / Honours / Degree**: Degree, Major / Subject, University (supports the complete 200+ universities list), CGPA, Duration, Passing Year.
  - **Masters / Post-Graduation**: Optional toggle with full degree details.
  - **Job Experience**: Optional toggle supporting multiple employment details.
- **🎯 Captcha & Declaration Ready**:
  - Automatically ticks the applicant declaration checkbox (`#agree`).
  - Smoothly scrolls to the Captcha field (`#captcha`) with an animated pulsing highlight and focused cursor so you can immediately type the 4-digit code and submit.
- **💾 100% Client-Side & Private**: All profile details stay entirely inside your browser's local storage (`chrome.storage.local`). **No analytics, no remote servers, no tracking.**
- **📥 Import / Export & In-Page Capture**:
  - Export your profile to JSON for safe backup or transfer across devices.
  - Import any profile JSON with one click.
  - Use **"Save Form"** to capture any already-filled application page directly into your profile!

---

## 🌐 Supported Portals

Works out of the box across **all** Bangladesh Government recruitment portals powered by Teletalk, including:

- `https://*.teletalk.com.bd/application.php`
- `https://alljobs.teletalk.com.bd/*`
- Examples: `fri.teletalk.com.bd`, `bpsc.teletalk.com.bd`, `dpe.teletalk.com.bd`, `dgfood.teletalk.com.bd`, `dgfp.teletalk.com.bd`, `br.teletalk.com.bd`, and 60+ ministry circulars.

---

## 📦 Installation

Compatible with **Google Chrome**, **Microsoft Edge**, **Brave**, **Opera**, and any Chromium-based browser.

### Step 1: Download or Clone
```bash
git clone https://github.com/shahriarjahin/teletalk-job-autofiller.git
```
*(Or click **Code -> Download ZIP** on GitHub and unzip the folder).*

### Step 2: Load into Browser
1. Open your browser and navigate to the extensions page:
   - Chrome / Brave: `chrome://extensions/`
   - Edge: `edge://extensions/`
2. Turn ON **"Developer mode"** (toggle in the top-right corner).
3. Click the **"Load unpacked"** button.
4. Select the `teletalk-job-autofiller` folder.
5. Pin **Teletalk Job FastFiller** to your browser toolbar.

---

## 🛠️ How to Use

### 1. Set Up Your Profile (One-Time Setup)
1. Click the extension icon in your browser toolbar.
2. Enter your details across the tabs (**Personal**, **Address**, **Education**, **Experience**).
3. Alternatively, click **📤 Import Profile (JSON)** in the **⚙️ Manage** tab and load your profile file.
4. Click **💾 Save Profile**.

### 2. Apply to Any Job Circular
1. Go to any Teletalk recruitment portal (e.g., `https://fri.teletalk.com.bd/` or your circular link).
2. Select your desired post and proceed to `application.php`.
3. Press **`Alt + A`** (or click the floating **⚡ Auto-Fill Application** pill in the bottom-right corner).
4. All personal, address, and academic fields will populate in under a second!
5. Type the 4-digit Captcha code, upload your photo (300×300) and signature (300×80), and submit.

---

## 📋 JSON Profile Template

You can create or backup your profile using standard JSON:

```json
{
  "name": "MD. APPLICANT NAME",
  "name_bn": "মোঃ আবেদনকারীর নাম",
  "father": "FATHER NAME",
  "father_bn": "পিতার নাম",
  "mother": "MOTHER NAME",
  "mother_bn": "মাতার নাম",
  "dob": "2000-01-01",
  "gender": "Male",
  "religion": "Islam",
  "marital_status": "Single",
  "spouse_name": "",
  "nid": "1",
  "nid_no": "19900000000000000",
  "breg": "2",
  "breg_no": "",
  "passport": "2",
  "passport_no": "",
  "mobile": "01700000000",
  "confirm_mobile": "01700000000",
  "email": "applicant@example.com",
  "quota": "Non Quota",
  "dep_status": "None",

  "present_careof": "Father Name",
  "present_village": "Road 1, Block A",
  "present_district": "Dhaka",
  "present_upazila": "Dhanmondi",
  "present_post": "Dhanmondi",
  "present_postcode": "1205",
  "same_as_present": true,

  "ssc_exam": "S.S.C",
  "ssc_roll": "100001",
  "ssc_group": "Science",
  "ssc_board": "Dhaka",
  "ssc_result_type": "GPA(out of 5)",
  "ssc_result": "5.00",
  "ssc_year": "2016",

  "hsc_exam": "H.S.C",
  "hsc_roll": "200001",
  "hsc_group": "Science",
  "hsc_board": "Dhaka",
  "hsc_result_type": "GPA(out of 5)",
  "hsc_result": "5.00",
  "hsc_year": "2018",

  "gra_exam": "B.Sc (Honours)",
  "gra_subject": "Computer Science & Engineering",
  "gra_institute": "University of Dhaka",
  "gra_result_type": "CGPA(out of 4)",
  "gra_result": "3.75",
  "gra_year": "2022",
  "gra_duration": "4 Years",

  "if_applicable_mas": false,
  "if_applicable_exp": false
}
```

---

## 🔒 Privacy & Security

- **Zero Data Collection**: This extension does not send any data to external servers or third-party APIs.
- **Local Storage Only**: All information is saved strictly within your browser's private `chrome.storage.local`.
- **Manual Verification**: Photo, signature, and CAPTCHA are intentionally left for manual user review to ensure 100% compliance with government application guidelines.

---

## ⌨️ Shortcuts & Hotkeys

| Shortcut | Action |
| :--- | :--- |
| **`Alt + A`** | Auto-fill active Teletalk application form |

---

## 🤝 Contributing

Contributions, feedback, and issue reports are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
