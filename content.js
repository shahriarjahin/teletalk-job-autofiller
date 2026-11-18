// Teletalk Job FastFiller - In-Page Content Script
// Supports *.teletalk.com.bd and alljobs.teletalk.com.bd

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__teletalkFastFillerLoaded) return;
  window.__teletalkFastFillerLoaded = true;

  console.log('[Teletalk FastFiller] Loaded on:', window.location.href);

  // Initialize UI if we are on a job application page
  function init() {
    if (isTeletalkApplicationPage()) {
      injectFloatingButton();
      initKeyboardShortcuts();
    }
  }

  function isTeletalkApplicationPage() {
    return Boolean(
      document.querySelector('form') &&
      (
        document.getElementById('name') ||
        document.getElementById('father') ||
        document.getElementById('dob') ||
        document.querySelector('[name="name"]') ||
        window.location.pathname.includes('application.php')
      )
    );
  }

  // Inject floating action button in bottom-right
  function injectFloatingButton() {
    if (document.getElementById('teletalk-autofiller-fab')) return;

    const fab = document.createElement('div');
    fab.id = 'teletalk-autofiller-fab';
    fab.innerHTML = `
      <span class="tff-status-text">🇧🇩 Teletalk FastFiller</span>
      <button class="tff-btn-trigger" id="tff-trigger-btn" title="Auto-fill with saved details (Alt+A)">
        ⚡ Auto-Fill Application (Alt+A)
      </button>
      <button class="tff-btn-secondary" id="tff-save-btn" title="Save this filled form as your profile">
        💾 Save Form
      </button>
      <button class="tff-btn-close" id="tff-close-btn" title="Dismiss">×</button>
    `;

    document.body.appendChild(fab);

    document.getElementById('tff-trigger-btn').addEventListener('click', runAutofill);
    document.getElementById('tff-save-btn').addEventListener('click', savePageAsProfile);
    document.getElementById('tff-close-btn').addEventListener('click', () => {
      fab.style.display = 'none';
    });
  }

  // Global Keyboard Shortcut: Alt + A
  function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        runAutofill();
      }
    });
  }

  // Save current page form directly as user's profile
  function savePageAsProfile() {
    const extracted = extractCurrentFormData();
    if (extracted.fieldsCount < 5) {
      showToast('⚠️ Form seems empty. Fill the form before saving.', 'error');
      return;
    }
    chrome.storage.local.set({ teletalk_profile: extracted.profile }, () => {
      showToast(`💾 Saved ${extracted.fieldsCount} fields as your active profile!`, 'success');
    });
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autofill') {
      runAutofill().then(res => sendResponse(res));
      return true; // Keep channel open for async response
    }
    if (request.action === 'extract_profile') {
      const extracted = extractCurrentFormData();
      chrome.storage.local.set({ teletalk_profile: extracted.profile }, () => {
        sendResponse(extracted);
      });
      return true;
    }
  });

  // Extract all filled fields from the current page
  function extractCurrentFormData() {
    const p = {};
    let count = 0;

    const getTextOrVal = (id) => {
      const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
      if (!el) return '';
      if (el.tagName === 'SELECT') {
        const opt = el.options[el.selectedIndex];
        return opt ? opt.text.trim() : (el.value || '');
      }
      return el.value ? el.value.trim() : '';
    };

    const getRawVal = (id) => {
      const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
      if (!el) return '';
      return el.value ? el.value.trim() : '';
    };

    const getChecked = (id) => {
      const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
      return el ? Boolean(el.checked) : false;
    };

    p.name = getRawVal('name');
    p.name_bn = getRawVal('name_bn');
    p.father = getRawVal('father');
    p.father_bn = getRawVal('father_bn');
    p.mother = getRawVal('mother');
    p.mother_bn = getRawVal('mother_bn');
    p.dob = getRawVal('dob');
    p.gender = getTextOrVal('gender');
    p.religion = getTextOrVal('religion');
    p.marital_status = getTextOrVal('marital_status');
    p.spouse_name = getRawVal('spouse_name');
    p.nid = getRawVal('nid') || (getTextOrVal('nid') === 'Yes' ? '1' : '2');
    p.nid_no = getRawVal('nid_no');
    p.breg = getRawVal('breg') || (getTextOrVal('breg') === 'Yes' ? '1' : '2');
    p.breg_no = getRawVal('breg_no');
    p.passport = getRawVal('passport') || (getTextOrVal('passport') === 'Yes' ? '1' : '2');
    p.passport_no = getRawVal('passport_no');
    p.mobile = getRawVal('mobile');
    p.confirm_mobile = getRawVal('confirm_mobile') || p.mobile;
    p.email = getRawVal('email');
    p.quota = getTextOrVal('quota') || 'Non Quota';
    p.dep_status = getTextOrVal('dep_status') || 'None';

    p.present_careof = getRawVal('present_careof');
    p.present_village = getRawVal('present_village');
    p.present_district = getTextOrVal('present_district');
    p.present_upazila = getTextOrVal('present_upazila');
    p.present_post = getRawVal('present_post');
    p.present_postcode = getRawVal('present_postcode');
    p.same_as_present = getChecked('same_as_present');

    p.permanent_careof = getRawVal('permanent_careof') || p.present_careof;
    p.permanent_village = getRawVal('permanent_village') || p.present_village;
    p.permanent_district = getTextOrVal('permanent_district') || p.present_district;
    p.permanent_upazila = getTextOrVal('permanent_upazila') || p.present_upazila;
    p.permanent_post = getRawVal('permanent_post') || p.present_post;
    p.permanent_postcode = getRawVal('permanent_postcode') || p.present_postcode;

    p.ssc_exam = getTextOrVal('ssc_exam');
    p.ssc_roll = getRawVal('ssc_roll');
    p.ssc_group = getTextOrVal('ssc_group');
    p.ssc_board = getTextOrVal('ssc_board');
    p.ssc_result_type = getTextOrVal('ssc_result_type');
    p.ssc_result = getRawVal('ssc_result');
    p.ssc_year = getTextOrVal('ssc_year');

    p.hsc_exam = getTextOrVal('hsc_exam');
    p.hsc_roll = getRawVal('hsc_roll');
    p.hsc_group = getTextOrVal('hsc_group');
    p.hsc_board = getTextOrVal('hsc_board');
    p.hsc_result_type = getTextOrVal('hsc_result_type');
    p.hsc_result = getRawVal('hsc_result');
    p.hsc_year = getTextOrVal('hsc_year');

    p.gra_exam = getTextOrVal('gra_exam');
    p.gra_subject = getTextOrVal('gra_subject');
    p.gra_institute = getTextOrVal('gra_institute');
    p.gra_result_type = getTextOrVal('gra_result_type');
    p.gra_result = getRawVal('gra_result');
    p.gra_year = getTextOrVal('gra_year');
    p.gra_duration = getTextOrVal('gra_duration');

    p.if_applicable_mas = getChecked('if_applicable_mas');
    p.if_applicable_exp = getChecked('if_applicable_exp');

    // Count filled fields
    Object.keys(p).forEach(k => {
      if (p[k] && p[k] !== '' && p[k] !== false) count++;
    });

    return { success: true, profile: p, fieldsCount: count };
  }

  // Main Autofill Runner
  async function runAutofill() {
    showToast('⚡ Reading saved profile...', 'info');

    return new Promise((resolve) => {
      chrome.storage.local.get(['teletalk_profile'], async (res) => {
        const profile = res.teletalk_profile;
        if (!profile || !profile.name) {
          showToast('⚠️ Profile is empty! Click the extension icon to set your details.', 'error');
          resolve({ success: false, error: 'Empty profile' });
          return;
        }

        try {
          const filledCount = await executeFormFill(profile);
          showToast(`🎯 Form filled successfully! (${filledCount} fields)`, 'success');
          resolve({ success: true, fieldsCount: filledCount });
        } catch (err) {
          console.error('[Teletalk FastFiller] Error during autofill:', err);
          showToast('⚠️ Autofill finished with some warnings. Check form.', 'error');
          resolve({ success: false, error: err.message });
        }
      });
    });
  }

  // Core Form Filling Logic
  async function executeFormFill(p) {
    let count = 0;

    // 1. Basic Personal Information
    if (fillField('name', p.name)) count++;
    if (fillField('name_bn', p.name_bn)) count++;
    if (fillField('father', p.father)) count++;
    if (fillField('father_bn', p.father_bn)) count++;
    if (fillField('mother', p.mother)) count++;
    if (fillField('mother_bn', p.mother_bn)) count++;
    if (fillField('dob', p.dob)) count++;
    if (fillField('gender', p.gender)) count++;
    if (fillField('religion', p.religion)) count++;
    if (fillField('mobile', p.mobile)) count++;
    if (fillField('confirm_mobile', p.confirm_mobile || p.mobile)) count++;
    if (fillField('email', p.email)) count++;
    if (fillField('quota', p.quota)) count++;
    if (fillField('dep_status', p.dep_status)) count++;

    // 2. Nationality (Bangladeshi default)
    const natEl = document.getElementById('nationality') || document.querySelector('[name="nationality"]');
    if (natEl && natEl.tagName === 'SELECT') {
      selectOption(natEl, 'Bangladeshi');
      count++;
    }

    // 3. Marital Status & Spouse Name
    if (fillField('marital_status', p.marital_status)) count++;
    if (p.marital_status === 'Married' && p.spouse_name) {
      await sleep(100);
      if (fillField('spouse_name', p.spouse_name)) count++;
    }

    // 4. National ID
    if (p.nid) {
      fillField('nid', p.nid);
      count++;
      if (p.nid === '1' && p.nid_no) {
        await sleep(100);
        if (fillField('nid_no', p.nid_no)) count++;
      }
    }

    // 5. Birth Registration
    if (p.breg) {
      fillField('breg', p.breg);
      count++;
      if (p.breg === '1' && p.breg_no) {
        await sleep(100);
        if (fillField('breg_no', p.breg_no)) count++;
      }
    }

    // 6. Passport
    if (p.passport) {
      fillField('passport', p.passport);
      count++;
      if (p.passport === '1' && p.passport_no) {
        await sleep(100);
        if (fillField('passport_no', p.passport_no)) count++;
      }
    }

    // 7. Address - Present Address
    if (fillField('present_careof', p.present_careof)) count++;
    if (fillField('present_village', p.present_village)) count++;
    if (fillField('present_post', p.present_post)) count++;
    if (fillField('present_postcode', p.present_postcode)) count++;

    // Present District -> Async Upazila
    const distEl = document.getElementById('present_district') || document.querySelector('[name="present_district"]');
    if (distEl && p.present_district) {
      selectOption(distEl, p.present_district);
      count++;

      // Wait for AJAX Upazila dropdown to populate
      const upazilaLoaded = await waitForUpazilaOptions('present_upazila', 3000);
      if (upazilaLoaded && p.present_upazila) {
        const upEl = document.getElementById('present_upazila') || document.querySelector('[name="present_upazila"]');
        if (selectOption(upEl, p.present_upazila)) count++;
      }
    }

    // Brief delay to ensure Upazila is finalized before address mirroring
    await sleep(250);

    // 8. Address - Permanent Address
    const sameBox = document.getElementById('same_as_present') || document.querySelector('[name="same_as_present"]');
    if (sameBox && p.same_as_present) {
      if (!sameBox.checked) {
        sameBox.checked = true;
        sameBox.dispatchEvent(new Event('click', { bubbles: true }));
        sameBox.dispatchEvent(new Event('change', { bubbles: true }));
      }
      count++;
    } else if (!p.same_as_present) {
      if (fillField('permanent_careof', p.permanent_careof)) count++;
      if (fillField('permanent_village', p.permanent_village)) count++;
      if (fillField('permanent_post', p.permanent_post)) count++;
      if (fillField('permanent_postcode', p.permanent_postcode)) count++;

      const permDistEl = document.getElementById('permanent_district') || document.querySelector('[name="permanent_district"]');
      if (permDistEl && p.permanent_district) {
        selectOption(permDistEl, p.permanent_district);
        count++;
        const permUpLoaded = await waitForUpazilaOptions('permanent_upazila', 3000);
        if (permUpLoaded && p.permanent_upazila) {
          const permUpEl = document.getElementById('permanent_upazila') || document.querySelector('[name="permanent_upazila"]');
          if (selectOption(permUpEl, p.permanent_upazila)) count++;
        }
      }
    }

    // 9. Education - SSC
    if (fillField('ssc_exam', p.ssc_exam)) count++;
    if (fillField('ssc_roll', p.ssc_roll)) count++;
    if (fillField('ssc_group', p.ssc_group)) count++;
    if (fillField('ssc_board', p.ssc_board)) count++;
    if (fillField('ssc_result_type', p.ssc_result_type)) {
      count++;
      await sleep(150);
      if (fillField('ssc_result', p.ssc_result)) count++;
    }
    if (fillField('ssc_year', p.ssc_year)) count++;

    // 10. Education - HSC
    if (fillField('hsc_exam', p.hsc_exam)) count++;
    if (fillField('hsc_roll', p.hsc_roll)) count++;
    if (fillField('hsc_group', p.hsc_group)) count++;
    if (fillField('hsc_board', p.hsc_board)) count++;
    if (fillField('hsc_result_type', p.hsc_result_type)) {
      count++;
      await sleep(150);
      if (fillField('hsc_result', p.hsc_result)) count++;
    }
    if (fillField('hsc_year', p.hsc_year)) count++;

    // 11. Education - Graduation
    if (fillField('gra_exam', p.gra_exam)) count++;
    if (fillField('gra_institute', p.gra_institute)) count++;
    if (fillField('gra_subject', p.gra_subject)) count++;
    if (fillField('gra_result_type', p.gra_result_type)) {
      count++;
      await sleep(150);
      if (fillField('gra_result', p.gra_result)) count++;
    }
    if (fillField('gra_year', p.gra_year)) count++;
    if (fillField('gra_duration', p.gra_duration)) count++;

    // 12. Education - Masters (if applicable)
    if (p.if_applicable_mas) {
      const masCheck = document.getElementById('if_applicable_mas') || document.querySelector('[name="if_applicable_mas"]');
      if (masCheck) {
        if (!masCheck.checked) {
          masCheck.checked = true;
          masCheck.dispatchEvent(new Event('click', { bubbles: true }));
          masCheck.dispatchEvent(new Event('change', { bubbles: true }));
        }
        count++;
        await sleep(200);

        if (fillField('mas_exam', p.mas_exam)) count++;
        if (fillField('mas_institute', p.mas_institute)) count++;
        if (fillField('mas_subject', p.mas_subject)) count++;
        if (fillField('mas_result_type', p.mas_result_type)) {
          count++;
          await sleep(150);
          if (fillField('mas_result', p.mas_result)) count++;
        }
        if (fillField('mas_year', p.mas_year)) count++;
        if (fillField('mas_duration', p.mas_duration)) count++;
      }
    }

    // 13. Job Experience (if applicable)
    if (p.if_applicable_exp) {
      const expCheck = document.getElementById('if_applicable_exp') || document.querySelector('[name="if_applicable_exp"]');
      if (expCheck) {
        if (!expCheck.checked) {
          expCheck.checked = true;
          expCheck.dispatchEvent(new Event('click', { bubbles: true }));
          expCheck.dispatchEvent(new Event('change', { bubbles: true }));
        }
        count++;
        await sleep(200);

        if (fillField('employment_type', p.employment_type)) count++;
        if (fillField('designation', p.designation)) count++;
        if (fillField('organization', p.organization)) count++;
        if (fillField('job_start_date', p.job_start_date)) count++;
        if (fillField('job_end_date', p.job_end_date)) count++;
        if (p.currently_working) {
          const currCheck = document.getElementById('currently_working') || document.querySelector('[name="currently_working"]');
          if (currCheck && !currCheck.checked) {
            currCheck.checked = true;
            currCheck.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        if (fillField('office_address', p.office_address)) count++;
        if (fillField('job_description', p.job_description)) count++;
      }
    }

    // 14. Declaration Checkbox (#agree)
    const agreeEl = document.getElementById('agree') || document.querySelector('[name="agree"]');
    if (agreeEl && !agreeEl.checked) {
      agreeEl.checked = true;
      agreeEl.dispatchEvent(new Event('click', { bubbles: true }));
      agreeEl.dispatchEvent(new Event('change', { bubbles: true }));
      count++;
    }

    // 15. Smoothly focus Captcha field for user manual completion
    focusCaptchaField();

    return count;
  }

  // Helper: fill either input or select
  function fillField(idOrName, value) {
    if (value === undefined || value === null || value === '') return false;
    const el = document.getElementById(idOrName) || 
               document.querySelector(`[name="${idOrName}"]`) ||
               document.querySelector(`[name="job[0][${idOrName}]"]`);
    if (!el) return false;

    if (el.tagName === 'SELECT') {
      return selectOption(el, value);
    } else if (el.type === 'checkbox') {
      el.checked = Boolean(value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } else {
      return fillInput(el, value);
    }
  }

  // Fill text/tel/email/date/number input with standard event triggers
  function fillInput(el, val) {
    if (!el || val === undefined || val === null || val === '') return false;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    el.classList.add('tff-field-filled');
    return true;
  }

  // Smart select option matching
  function selectOption(el, target) {
    if (!el || !target) return false;
    const targetStr = String(target).trim().toLowerCase();

    // 1. Direct value match
    for (let i = 0; i < el.options.length; i++) {
      if (el.options[i].value.trim().toLowerCase() === targetStr) {
        el.selectedIndex = i;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.classList.add('tff-field-filled');
        return true;
      }
    }

    // 2. Direct text match
    for (let i = 0; i < el.options.length; i++) {
      if (el.options[i].text.trim().toLowerCase() === targetStr) {
        el.selectedIndex = i;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.classList.add('tff-field-filled');
        return true;
      }
    }

    // 3. Substring / contains match
    for (let i = 0; i < el.options.length; i++) {
      const optText = el.options[i].text.trim().toLowerCase();
      if (optText.length > 2 && (optText.includes(targetStr) || targetStr.includes(optText))) {
        el.selectedIndex = i;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.classList.add('tff-field-filled');
        return true;
      }
    }

    return false;
  }

  // Poll for AJAX Upazila dropdown options
  async function waitForUpazilaOptions(idOrName, timeoutMs = 3000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = document.getElementById(idOrName) || document.querySelector(`[name="${idOrName}"]`);
      if (el && el.options && el.options.length > 1) {
        return true;
      }
      await sleep(100);
    }
    return false;
  }

  // Focus and highlight Captcha field
  function focusCaptchaField() {
    const captchaEl = document.getElementById('captcha') ||
                      document.querySelector('[name="validation_code"]') ||
                      document.querySelector('[name="captcha"]') ||
                      document.querySelector('input[type="text"][placeholder*="captcha" i]');

    if (captchaEl) {
      captchaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      captchaEl.classList.add('tff-captcha-focus');
      setTimeout(() => {
        captchaEl.focus();
      }, 400);
    }
  }

  // In-page Toast Notification
  function showToast(message, type = 'info') {
    let toast = document.getElementById('teletalk-autofiller-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'teletalk-autofiller-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    if (type === 'error') {
      toast.style.borderLeftColor = '#ef4444';
    } else if (type === 'success') {
      toast.style.borderLeftColor = '#10b981';
    } else {
      toast.style.borderLeftColor = '#3b82f6';
    }

    toast.classList.add('show');
    clearTimeout(window.__tffToastTimeout);
    window.__tffToastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
