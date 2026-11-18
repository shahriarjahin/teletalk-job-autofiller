// Teletalk Job FastFiller - Popup Controller

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initConditionalFields();
  loadSavedProfile();
  initActions();
});

// All input IDs to store and manage
const FIELD_IDS = [
  // Personal
  'name', 'name_bn', 'father', 'father_bn', 'mother', 'mother_bn',
  'dob', 'gender', 'religion', 'marital_status', 'spouse_name',
  'nid', 'nid_no', 'breg', 'breg_no', 'passport', 'passport_no',
  'mobile', 'confirm_mobile', 'email', 'quota', 'dep_status',

  // Address
  'present_careof', 'present_village', 'present_district', 'present_upazila',
  'present_post', 'present_postcode', 'same_as_present',
  'permanent_careof', 'permanent_village', 'permanent_district',
  'permanent_upazila', 'permanent_post', 'permanent_postcode',

  // Education - SSC
  'ssc_exam', 'ssc_roll', 'ssc_group', 'ssc_board', 'ssc_result_type', 'ssc_result', 'ssc_year',

  // Education - HSC
  'hsc_exam', 'hsc_roll', 'hsc_group', 'hsc_board', 'hsc_result_type', 'hsc_result', 'hsc_year',

  // Education - Graduation
  'gra_exam', 'gra_subject', 'gra_institute', 'gra_result_type', 'gra_result', 'gra_year', 'gra_duration',

  // Education - Masters
  'if_applicable_mas', 'mas_exam', 'mas_subject', 'mas_institute', 'mas_result_type', 'mas_result', 'mas_year', 'mas_duration',

  // Experience
  'if_applicable_exp', 'employment_type', 'designation', 'organization', 'job_start_date', 'job_end_date', 'currently_working', 'office_address', 'job_description'
];

// Tabs Navigation
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.tab}`;
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });
}

// Dynamic field visibility toggles
function initConditionalFields() {
  // Marital Status
  const marital = document.getElementById('marital_status');
  const spouseBox = document.getElementById('spouseBox');
  const updateMarital = () => {
    spouseBox.style.display = marital.value === 'Married' ? 'flex' : 'none';
  };
  marital.addEventListener('change', updateMarital);
  updateMarital();

  // NID
  const nid = document.getElementById('nid');
  const nidNoBox = document.getElementById('nidNoBox');
  const updateNid = () => {
    nidNoBox.style.display = nid.value === '1' ? 'flex' : 'none';
  };
  nid.addEventListener('change', updateNid);
  updateNid();

  // Birth Reg
  const breg = document.getElementById('breg');
  const bregNoBox = document.getElementById('bregNoBox');
  const updateBreg = () => {
    bregNoBox.style.display = breg.value === '1' ? 'flex' : 'none';
  };
  breg.addEventListener('change', updateBreg);
  updateBreg();

  // Passport
  const passport = document.getElementById('passport');
  const passportNoBox = document.getElementById('passportNoBox');
  const updatePassport = () => {
    passportNoBox.style.display = passport.value === '1' ? 'flex' : 'none';
  };
  passport.addEventListener('change', updatePassport);
  updatePassport();

  // Address Same as Present
  const sameAsPresent = document.getElementById('same_as_present');
  const permBox = document.getElementById('permanentAddressBox');
  const updateAddress = () => {
    permBox.style.display = sameAsPresent.checked ? 'none' : 'block';
  };
  sameAsPresent.addEventListener('change', updateAddress);
  updateAddress();

  // Masters Checkbox
  const masCheck = document.getElementById('if_applicable_mas');
  const masBox = document.getElementById('mastersBox');
  const updateMas = () => {
    masBox.style.display = masCheck.checked ? 'block' : 'none';
  };
  masCheck.addEventListener('change', updateMas);
  updateMas();

  // Experience Checkbox
  const expCheck = document.getElementById('if_applicable_exp');
  const expBox = document.getElementById('experienceBox');
  const noExpNotice = document.getElementById('noExpNotice');
  const updateExp = () => {
    expBox.style.display = expCheck.checked ? 'block' : 'none';
    noExpNotice.style.display = expCheck.checked ? 'none' : 'block';
  };
  expCheck.addEventListener('change', updateExp);
  updateExp();

  // Auto-sync confirm mobile if typing mobile
  const mobileInput = document.getElementById('mobile');
  const confirmMobileInput = document.getElementById('confirm_mobile');
  mobileInput.addEventListener('input', () => {
    if (!confirmMobileInput.value || confirmMobileInput.value.length < mobileInput.value.length) {
      confirmMobileInput.value = mobileInput.value;
    }
  });
}

// Collect form data into profile object
function collectFormData() {
  const profile = {};
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') {
      profile[id] = el.checked;
    } else {
      profile[id] = el.value.trim();
    }
  });
  return profile;
}

// Populate form from profile object
function applyFormData(profile) {
  if (!profile) return;
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (profile[id] !== undefined) {
      if (el.type === 'checkbox') {
        el.checked = Boolean(profile[id]);
      } else {
        el.value = profile[id];
      }
    }
  });

  // Trigger change events to update conditional visibility
  ['marital_status', 'nid', 'breg', 'passport', 'same_as_present', 'if_applicable_mas', 'if_applicable_exp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.dispatchEvent(new Event('change'));
  });
}

// Save profile to chrome.storage.local
function saveProfile(showFeedback = true) {
  const profile = collectFormData();
  chrome.storage.local.set({ teletalk_profile: profile }, () => {
    if (showFeedback) {
      showStatus('✅ Profile saved successfully!');
    }
  });
}

// Sample demo profile for testing purposes
const DEMO_PROFILE = {
  name: "MD. RAHIM AHMED",
  name_bn: "মোঃ রহিম আহমেদ",
  father: "MD. KARIM AHMED",
  father_bn: "মোঃ করিম আহমেদ",
  mother: "FATEMA BEGUM",
  mother_bn: "ফাতেমা বেগম",
  dob: "2000-01-01",
  gender: "Male",
  religion: "Islam",
  marital_status: "Single",
  spouse_name: "",
  nid: "1",
  nid_no: "19900000000000000",
  breg: "2",
  breg_no: "",
  passport: "2",
  passport_no: "",
  mobile: "01700000000",
  confirm_mobile: "01700000000",
  email: "applicant@example.com",
  quota: "Non Quota",
  dep_status: "None",

  present_careof: "MD. KARIM AHMED",
  present_village: "House 10, Road 4, Sector 1",
  present_district: "Dhaka",
  present_upazila: "Uttara",
  present_post: "Uttara",
  present_postcode: "1230",
  same_as_present: true,

  permanent_careof: "MD. KARIM AHMED",
  permanent_village: "House 10, Road 4, Sector 1",
  permanent_district: "Dhaka",
  permanent_upazila: "Uttara",
  permanent_post: "Uttara",
  permanent_postcode: "1230",

  ssc_exam: "S.S.C",
  ssc_roll: "100001",
  ssc_group: "Science",
  ssc_board: "Dhaka",
  ssc_result_type: "GPA(out of 5)",
  ssc_result: "5.00",
  ssc_year: "2016",

  hsc_exam: "H.S.C",
  hsc_roll: "200001",
  hsc_group: "Science",
  hsc_board: "Dhaka",
  hsc_result_type: "GPA(out of 5)",
  hsc_result: "5.00",
  hsc_year: "2018",

  gra_exam: "B.Sc (Honours)",
  gra_subject: "Computer Science & Engineering",
  gra_institute: "University of Dhaka",
  gra_result_type: "CGPA(out of 4)",
  gra_result: "3.75",
  gra_year: "2022",
  gra_duration: "4 Years",

  if_applicable_mas: false,
  if_applicable_exp: false
};

// Load profile from chrome.storage.local (blank by default if not saved yet)
function loadSavedProfile() {
  chrome.storage.local.get(['teletalk_profile'], res => {
    if (res.teletalk_profile && res.teletalk_profile.name) {
      applyFormData(res.teletalk_profile);
    }
  });
}

// Show temporary status message in footer
function showStatus(text, isError = false) {
  const statusEl = document.getElementById('statusMsg');
  statusEl.textContent = text;
  statusEl.style.color = isError ? '#b91c1c' : '#047857';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 3500);
}

// Buttons & Actions
function initActions() {
  // Save button
  document.getElementById('btnSaveProfile').addEventListener('click', () => {
    saveProfile(true);
  });

  // Capture from Active Page
  const btnCapture = document.getElementById('btnCapturePage');
  if (btnCapture) {
    btnCapture.addEventListener('click', () => {
      showStatus('📥 Capturing form data from active page...');

      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (!tabs || tabs.length === 0) {
          showStatus('⚠️ No active tab found', true);
          return;
        }

        const activeTab = tabs[0];
        if (!activeTab.url || !activeTab.url.includes('teletalk.com.bd')) {
          showStatus('⚠️ Please switch to the open Teletalk job application tab', true);
          return;
        }

        chrome.tabs.sendMessage(activeTab.id, { action: 'extract_profile' }, response => {
          if (chrome.runtime.lastError || !response || !response.success) {
            showStatus('⚠️ Could not capture form. Refresh the Teletalk page and retry.', true);
          } else {
            applyFormData(response.profile);
            saveProfile(true);
            showStatus(`✅ Captured ${response.fieldsCount} fields from active application!`);
          }
        });
      });
    });
  }

  // Quick fill button (from popup header)
  document.getElementById('btnQuickFill').addEventListener('click', async () => {
    saveProfile(false);
    showStatus('⚡ Triggering Auto-Fill on active tab...');

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs || tabs.length === 0) {
        showStatus('⚠️ No active tab found', true);
        return;
      }

      const activeTab = tabs[0];
      if (!activeTab.url || !activeTab.url.includes('teletalk.com.bd')) {
        showStatus('⚠️ Please open a Teletalk job application page', true);
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: 'autofill' }, response => {
        if (chrome.runtime.lastError) {
          showStatus('⚠️ Content script not ready. Refresh the Teletalk page.', true);
        } else if (response && response.success) {
          showStatus(`🎯 Filled ${response.fieldsCount} fields!`);
        }
      });
    });
  });

  // Load Demo Data
  document.getElementById('btnLoadDemo').addEventListener('click', () => {
    applyFormData(DEMO_PROFILE);
    saveProfile(true);
    showStatus('✨ Sample demo profile loaded! You can modify with your real details.');
  });

  // Export JSON
  document.getElementById('btnExportJson').addEventListener('click', () => {
    const profile = collectFormData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "teletalk_job_profile.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showStatus('📥 Profile exported to JSON');
  });

  // Import JSON
  const importInput = document.getElementById('importFileInput');
  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        applyFormData(imported);
        saveProfile(false);
        showStatus('📤 Profile imported successfully!');
      } catch (err) {
        showStatus('⚠️ Invalid JSON file format', true);
      }
    };
    reader.readAsText(file);
  });

  // Clear Profile
  document.getElementById('btnClearProfile').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your saved profile details?')) {
      chrome.storage.local.remove(['teletalk_profile'], () => {
        document.querySelectorAll('input:not([type="checkbox"]), select, textarea').forEach(el => el.value = '');
        document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        document.getElementById('same_as_present').checked = true;
        document.getElementById('nid').value = '1';
        document.getElementById('breg').value = '2';
        document.getElementById('passport').value = '2';
        document.getElementById('gender').value = 'Male';
        document.getElementById('religion').value = 'Islam';
        document.getElementById('marital_status').value = 'Single';
        document.getElementById('quota').value = 'Non Quota';
        document.getElementById('dep_status').value = 'None';
        showStatus('🗑️ Profile cleared');
      });
    }
  });
}
