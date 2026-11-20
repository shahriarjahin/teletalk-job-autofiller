// Teletalk Job FastFiller - In-Page Content Script
// Supports Modern Teletalk (*.teletalk.com.bd, alljobs.teletalk.com.bd) & Classic BPSC (bpsc.teletalk.com.bd/ncad)

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
        document.getElementById('fathername') ||
        document.getElementById('dob') ||
        document.getElementById('b_day') ||
        document.getElementById('exam1') ||
        document.getElementById('present_care') ||
        document.querySelector('[name="name"]') ||
        window.location.pathname.includes('application.php') ||
        window.location.pathname.includes('apply')
      )
    );
  }

  // Detect whether the current page is Classic BPSC / Non-Cadre format
  function isClassicBPSCForm() {
    return Boolean(
      document.getElementById('fathername') ||
      document.getElementById('b_day') ||
      document.getElementById('menu_one') ||
      document.getElementById('exam1') ||
      document.querySelector('[name="fathername"]') ||
      document.querySelector('[name="menu_one"]') ||
      window.location.hostname.includes('bpsc.teletalk.com.bd')
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

  // Extract all filled fields from the current page (handles Modern & Classic BPSC)
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

    // 1. Basic Personal Information
    p.name = getRawVal('name');
    p.name_bn = getRawVal('bn_name') || getRawVal('name_bn');
    p.father = getRawVal('fathername') || getRawVal('father');
    p.father_bn = getRawVal('bn_father') || getRawVal('father_bn');
    p.mother = getRawVal('mothername') || getRawVal('mother');
    p.mother_bn = getRawVal('bn_mother') || getRawVal('mother_bn');

    // DOB (date input or 3 selects: b_day, b_month, b_year)
    if (getRawVal('dob')) {
      p.dob = getRawVal('dob');
    } else if (document.getElementById('b_year')) {
      const y = getTextOrVal('b_year');
      const m = getTextOrVal('b_month');
      const d = getTextOrVal('b_day');
      if (y && m && d) {
        const cleanY = y.replace(/[^0-9]/g, '');
        const cleanM = String(parseInt(m.replace(/[^0-9]/g, ''), 10)).padStart(2, '0');
        const cleanD = String(parseInt(d.replace(/[^0-9]/g, ''), 10)).padStart(2, '0');
        if (cleanY && cleanM && cleanD) {
          p.dob = `${cleanY}-${cleanM}-${cleanD}`;
        }
      }
    }

    p.gender = getTextOrVal('sex') || getTextOrVal('gender');
    p.religion = getTextOrVal('religion');

    // Marital Status
    if (getChecked('mstatus_02')) {
      p.marital_status = 'Married';
      const spInput = document.querySelector('input[name="s_name"]') || document.getElementById('spouse_name');
      p.spouse_name = spInput ? spInput.value.trim() : '';
    } else if (getChecked('mstatus_01')) {
      p.marital_status = 'Single';
    } else {
      p.marital_status = getTextOrVal('marital_status');
      p.spouse_name = getRawVal('spouse_name');
    }

    // NID
    if (getChecked('nid_01')) {
      p.nid = '1';
      const nidInput = document.querySelector('input[name="nid_no"]') || document.getElementById('nid_no');
      p.nid_no = nidInput ? nidInput.value.trim() : '';
    } else if (getChecked('nid_02')) {
      p.nid = '2';
    } else {
      p.nid = getRawVal('nid') || (getTextOrVal('nid') === 'Yes' ? '1' : '2');
      p.nid_no = getRawVal('nid_no');
    }

    p.breg = getRawVal('breg') || (getTextOrVal('breg') === 'Yes' ? '1' : '2');
    p.breg_no = getRawVal('breg_no');
    p.passport = getRawVal('passport') || (getTextOrVal('passport') === 'Yes' ? '1' : '2');
    p.passport_no = getRawVal('passport_no');

    p.mobile = getRawVal('mobileno') || getRawVal('mobile');
    p.confirm_mobile = getRawVal('confirmmobile') || getRawVal('confirm_mobile') || p.mobile;
    p.email = getRawVal('email');
    p.quota = getTextOrVal('ffq') || getTextOrVal('quota') || 'Non Quota';
    p.dep_status = getTextOrVal('dep_status') || 'None';

    // Address
    p.present_careof = getRawVal('present_care') || getRawVal('present_careof');
    p.present_village = getRawVal('present_vill') || getRawVal('present_village');
    p.present_district = getTextOrVal('menu_one') || getTextOrVal('present_district');
    p.present_upazila = getTextOrVal('menu_one_list') || getTextOrVal('present_upazila');
    p.present_post = getRawVal('present_post');
    p.present_postcode = getRawVal('present_pcode') || getRawVal('present_postcode');
    p.same_as_present = getChecked('copy') || getChecked('same_as_present');

    p.permanent_careof = getRawVal('permanent_care') || getRawVal('permanent_careof') || p.present_careof;
    p.permanent_village = getRawVal('permanent_vill') || getRawVal('permanent_village') || p.present_village;
    p.permanent_district = getTextOrVal('menu_two') || getTextOrVal('permanent_district') || p.present_district;
    p.permanent_upazila = getTextOrVal('menu_two_list') || getTextOrVal('permanent_upazila') || p.present_upazila;
    p.permanent_post = getRawVal('permanent_post') || p.present_post;
    p.permanent_postcode = getRawVal('permanent_pcode') || getRawVal('permanent_postcode') || p.present_postcode;

    // SSC
    p.ssc_exam = getTextOrVal('exam1') || getTextOrVal('ssc_exam');
    p.ssc_roll = getRawVal('roll1') || getRawVal('ssc_roll');
    p.ssc_reg = getRawVal('reg1');
    p.ssc_group = getTextOrVal('subject1') || getTextOrVal('ssc_group');
    p.ssc_board = getTextOrVal('institute1') || getTextOrVal('ssc_board');
    p.ssc_result_type = getTextOrVal('result1') || getTextOrVal('ssc_result_type');
    p.ssc_result = getRawVal('result_gpa1') || getRawVal('ssc_result');
    p.ssc_year = getTextOrVal('year1') || getTextOrVal('ssc_year');

    // HSC
    p.hsc_exam = getTextOrVal('exam2') || getTextOrVal('hsc_exam');
    p.hsc_roll = getRawVal('roll2') || getRawVal('hsc_roll');
    p.hsc_reg = getRawVal('reg2');
    p.hsc_group = getTextOrVal('subject2') || getTextOrVal('hsc_group');
    p.hsc_board = getTextOrVal('institute2') || getTextOrVal('hsc_board');
    p.hsc_result_type = getTextOrVal('result2') || getTextOrVal('hsc_result_type');
    p.hsc_result = getRawVal('result_gpa2') || getRawVal('hsc_result');
    p.hsc_year = getTextOrVal('year2') || getTextOrVal('hsc_year');

    // Graduation
    p.gra_exam = getTextOrVal('exam3') || getTextOrVal('gra_exam');
    p.gra_subject = getTextOrVal('subject3') || getTextOrVal('gra_subject');
    p.gra_institute = getTextOrVal('institute3') || getTextOrVal('gra_institute');
    p.gra_result_type = getTextOrVal('result3') || getTextOrVal('gra_result_type');
    p.gra_result = getRawVal('result_gpa3') || getRawVal('gra_result');
    p.gra_year = getTextOrVal('year3') || getTextOrVal('gra_year');
    p.gra_duration = getTextOrVal('duration3') || getTextOrVal('gra_duration');

    // Masters & Experience flags
    p.if_applicable_mas = getChecked('masters') || getChecked('if_applicable_mas');
    p.if_applicable_exp = getChecked('job_no') || getChecked('if_applicable_exp');

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

  // Dispatch to appropriate form filling implementation
  async function executeFormFill(p) {
    if (isClassicBPSCForm()) {
      return await executeBPSCFormFill(p);
    } else {
      return await executeModernTeletalkFill(p);
    }
  }

  // =========================================================================
  // CLASSIC BPSC / NON-CADRE FORM FILLING (bpsc.teletalk.com.bd/ncad/)
  // =========================================================================
  async function executeBPSCFormFill(p) {
    let count = 0;

    // 1. Applicant Name
    if (fillField('name', p.name)) count++;
    if (fillField('bn_name', p.name_bn)) count++;

    // 2. Father's Name
    if (fillField('fathername', p.father)) count++;
    if (fillField('bn_father', p.father_bn)) count++;

    // 3. Mother's Name
    if (fillField('mothername', p.mother)) count++;
    if (fillField('bn_mother', p.mother_bn)) count++;

    // 4. Date of Birth (3 selects: b_day, b_month, b_year)
    if (p.dob) {
      const parts = p.dob.trim().split(/[-/.]/);
      let y = '', m = '', d = '';
      if (parts.length === 3) {
        if (parts[0].length === 4) { // YYYY-MM-DD
          y = parts[0];
          m = String(parseInt(parts[1], 10)).padStart(2, '0');
          d = String(parseInt(parts[2], 10)).padStart(2, '0');
        } else if (parts[2].length === 4) { // DD-MM-YYYY
          d = String(parseInt(parts[0], 10)).padStart(2, '0');
          m = String(parseInt(parts[1], 10)).padStart(2, '0');
          y = parts[2];
        }

        const bDay = document.getElementById('b_day');
        const bMonth = document.getElementById('b_month');
        const bYear = document.getElementById('b_year');
        if (bDay && d && selectOption(bDay, d)) count++;
        if (bMonth && m && selectOption(bMonth, m)) count++;
        if (bYear && y && selectOption(bYear, y)) count++;
      }
    }

    // 5. Gender / Sex (#sex)
    const sexEl = document.getElementById('sex') || document.querySelector('[name="sex"]');
    if (sexEl && p.gender) {
      if (selectOption(sexEl, p.gender)) count++;
    }

    // 6. Quota & Special Categories
    const ffqEl = document.getElementById('ffq') || document.querySelector('[name="ffq"]');
    if (ffqEl) {
      if (!selectOption(ffqEl, p.quota || 'Non Quota')) {
        if (!selectOption(ffqEl, 'Non Freedom Fighter')) {
          selectOption(ffqEl, 'Non Quota');
        }
      }
      count++;
    }

    // Non-Tribal radio (#tribal2)
    const tribal2 = document.getElementById('tribal2');
    if (tribal2 && !tribal2.checked) {
      tribal2.checked = true;
      tribal2.dispatchEvent(new Event('change', { bubbles: true }));
      count++;
    }

    // Non-Handicap radio (#phc2)
    const phc2 = document.getElementById('phc2');
    if (phc2 && !phc2.checked) {
      phc2.checked = true;
      phc2.dispatchEvent(new Event('change', { bubbles: true }));
      count++;
    }

    // 7. Nationality
    const natEl = document.getElementById('nationality') || document.querySelector('[name="nationality"]');
    if (natEl) {
      selectOption(natEl, 'Bangladeshi');
      count++;
    }

    // 8. National ID (Radios: #nid_01 = Yes, #nid_02 = No)
    const hasNid = Boolean(
      (p.nid_no && String(p.nid_no).trim().length > 0) ||
      p.nid === '1' ||
      p.nid === 1 ||
      String(p.nid).toLowerCase() === 'yes'
    );

    const nidYes = document.getElementById('nid_01');
    const nidNo = document.getElementById('nid_02');
    const nidInput = document.querySelector('input[name="nid_no"]') || document.getElementById('xplod');

    if (hasNid || (nidYes && nidYes.checked)) {
      if (nidNo) nidNo.checked = false;
      if (nidYes) {
        nidYes.checked = true;
        nidYes.click();
        count++;
      }

      await sleep(100);

      // Explicitly ensure the input and its wrapping label are visible
      if (nidInput) {
        nidInput.style.display = '';
        nidInput.hidden = false;
        const parentLabel = nidInput.closest('label');
        if (parentLabel) parentLabel.style.display = '';

        if (p.nid_no) {
          fillInput(nidInput, p.nid_no);
          count++;
        }

        // Re-ensure visibility after filling (in case change event triggered FormManager hide)
        nidInput.style.display = '';
        nidInput.hidden = false;
        if (parentLabel) parentLabel.style.display = '';
      }
    } else if (p.nid === '2' && !nidInput?.value) {
      if (nidNo) {
        nidNo.click();
      }
    }

    // 9. Marital Status (Radios: #mstatus_01 = Single, #mstatus_02 = Married)
    const isMarried = (p.marital_status === 'Married');
    const mSingle = document.getElementById('mstatus_01');
    const mMarried = document.getElementById('mstatus_02');
    const spouseInput = document.querySelector('input[name="s_name"]');

    if (isMarried) {
      if (mSingle) mSingle.checked = false;
      if (mMarried) {
        mMarried.checked = true;
        mMarried.click();
        count++;
      }

      await sleep(100);

      if (spouseInput) {
        spouseInput.style.display = '';
        spouseInput.hidden = false;
        const parentLabel = spouseInput.closest('label');
        if (parentLabel) parentLabel.style.display = '';

        if (p.spouse_name) {
          fillInput(spouseInput, p.spouse_name);
          count++;
        }

        spouseInput.style.display = '';
        spouseInput.hidden = false;
        if (parentLabel) parentLabel.style.display = '';
      }
    } else {
      if (mSingle) {
        mSingle.click();
      }
    }

    // 10. Present Address
    if (fillField('present_care', p.present_careof)) count++;
    if (fillField('present_vill', p.present_village)) count++;
    if (fillField('present_post', p.present_post)) count++;
    if (fillField('present_pcode', p.present_postcode)) count++;
    if (fillField('bn_address', p.present_village)) count++;

    // Present District -> Async Upazila
    const distEl = document.getElementById('menu_one') || document.querySelector('[name="menu_one"]');
    if (distEl && p.present_district) {
      if (selectOption(distEl, p.present_district)) {
        count++;
        const upLoaded = await waitForDropdownOptions('menu_one_list', 3500);
        if (upLoaded && p.present_upazila) {
          const upEl = document.getElementById('menu_one_list') || document.querySelector('[name="menu_one_list"]');
          if (selectOption(upEl, p.present_upazila)) count++;
        }
      }
    }

    await sleep(200);

    // 11. Permanent Address
    const copyCheck = document.getElementById('copy') || document.querySelector('[name="copy"]');
    if (copyCheck && p.same_as_present) {
      if (!copyCheck.checked) {
        copyCheck.checked = true;
        copyCheck.dispatchEvent(new Event('click', { bubbles: true }));
        copyCheck.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof copyCheck.onclick === 'function') {
          try { copyCheck.onclick(); } catch(e) {}
        }
      }
      count++;
    } else if (!p.same_as_present) {
      if (fillField('permanent_care', p.permanent_careof)) count++;
      if (fillField('permanent_vill', p.permanent_village)) count++;
      if (fillField('permanent_post', p.permanent_post)) count++;
      if (fillField('permanent_pcode', p.permanent_postcode)) count++;

      const permDist = document.getElementById('menu_two') || document.querySelector('[name="menu_two"]');
      if (permDist && p.permanent_district) {
        if (selectOption(permDist, p.permanent_district)) {
          count++;
          const permUpLoaded = await waitForDropdownOptions('menu_two_list', 3500);
          if (permUpLoaded && p.permanent_upazila) {
            const permUpEl = document.getElementById('menu_two_list') || document.querySelector('[name="menu_two_list"]');
            if (selectOption(permUpEl, p.permanent_upazila)) count++;
          }
        }
      }
    }

    // 12. Contact Numbers
    if (fillField('mobileno', p.mobile)) count++;
    if (fillField('confirmmobile', p.confirm_mobile || p.mobile)) count++;

    // 13. Education - SSC
    if (fillField('exam1', p.ssc_exam || 'S.S.C')) count++;
    if (fillField('institute1', p.ssc_board)) count++;
    if (fillField('roll1', p.ssc_roll)) count++;
    if (p.ssc_reg) fillField('reg1', p.ssc_reg);

    const res1 = document.getElementById('result1') || document.querySelector('[name="result1"]');
    if (res1 && p.ssc_result_type) {
      if (selectOption(res1, p.ssc_result_type)) {
        count++;
        await sleep(200);
        const gpa1 = document.getElementById('result_gpa1') || document.querySelector('input[name="result_gpa1"]');
        if (gpa1 && p.ssc_result) {
          if (fillInput(gpa1, p.ssc_result)) count++;
        }
      }
    }
    if (fillField('subject1', p.ssc_group)) count++;
    if (fillField('year1', p.ssc_year)) count++;

    // 14. Education - HSC
    if (fillField('exam2', p.hsc_exam || 'H.S.C')) count++;
    if (fillField('institute2', p.hsc_board)) count++;
    if (fillField('roll2', p.hsc_roll)) count++;
    if (p.hsc_reg) fillField('reg2', p.hsc_reg);

    // Subject/Group is loaded dynamically after exam selection
    await waitForDropdownOptions('subject2', 2500);
    if (fillField('subject2', p.hsc_group)) count++;

    const res2 = document.getElementById('result2') || document.querySelector('[name="result2"]');
    if (res2 && p.hsc_result_type) {
      if (selectOption(res2, p.hsc_result_type)) {
        count++;
        await sleep(200);
        const gpa2 = document.getElementById('result_gpa2') || document.querySelector('input[name="result_gpa2"]');
        if (gpa2 && p.hsc_result) {
          if (fillInput(gpa2, p.hsc_result)) count++;
        }
      }
    }
    if (fillField('year2', p.hsc_year)) count++;

    // 15. Education - Graduation
    if (fillField('exam3', p.gra_exam)) count++;

    // Subject is loaded dynamically after exam selection
    await waitForDropdownOptions('subject3', 3000);
    if (fillField('subject3', p.gra_subject)) count++;

    if (fillField('institute3', p.gra_institute)) count++;

    const res3 = document.getElementById('result3') || document.querySelector('[name="result3"]');
    if (res3 && (p.gra_result_type || p.gra_result)) {
      if (selectOption(res3, p.gra_result_type || 'GPA/CGPA in scale 4')) {
        count++;
        await sleep(200);
        const gpa3 = document.getElementById('result_gpa3') || document.querySelector('input[name="result_gpa3"]');
        if (gpa3 && p.gra_result) {
          if (fillInput(gpa3, p.gra_result)) count++;
        }
      }
    }
    if (fillField('year3', p.gra_year)) count++;
    if (fillField('duration3', p.gra_duration)) count++;

    // 16. Education - Masters (if applicable)
    if (p.if_applicable_mas) {
      const masCheck = document.getElementById('masters') || document.querySelector('[name="masters"]');
      if (masCheck) {
        if (!masCheck.checked) {
          masCheck.checked = true;
          masCheck.dispatchEvent(new Event('click', { bubbles: true }));
          masCheck.dispatchEvent(new Event('change', { bubbles: true }));
          if (typeof masCheck.onclick === 'function') {
            try { masCheck.onclick(); } catch(e) {}
          }
        }
        count++;
        await sleep(250);

        if (fillField('exam4', p.mas_exam)) count++;
        await waitForDropdownOptions('subject4', 2500);
        if (fillField('subject4', p.mas_subject)) count++;
        if (fillField('institute4', p.mas_institute)) count++;

        const res4 = document.getElementById('result4') || document.querySelector('[name="result4"]');
        if (res4 && (p.mas_result_type || p.mas_result)) {
          if (selectOption(res4, p.mas_result_type || 'GPA/CGPA in scale 4')) {
            count++;
            await sleep(200);
            const gpa4 = document.getElementById('result_gpa4') || document.querySelector('input[name="result_gpa4"]');
            if (gpa4 && p.mas_result) fillInput(gpa4, p.mas_result);
          }
        }
        if (fillField('year4', p.mas_year)) count++;
        if (fillField('duration4', p.mas_duration)) count++;
      }
    }

    // 17. Job Experience (if applicable)
    if (p.if_applicable_exp) {
      const expCheck = document.getElementById('job_no') || document.querySelector('[name="job_no"]');
      if (expCheck) {
        if (!expCheck.checked) {
          expCheck.checked = true;
          expCheck.dispatchEvent(new Event('click', { bubbles: true }));
          expCheck.dispatchEvent(new Event('change', { bubbles: true }));
        }
        count++;
        await sleep(200);

        if (fillField('organization', p.organization)) count++;
        if (fillField('job_post', p.designation || p.job_post)) count++;
        if (fillField('job_address', p.office_address || p.job_address)) count++;
      }
    }

    // 18. Exam Centre
    const centreEl = document.getElementById('exam_centre') || document.querySelector('[name="exam_centre"]');
    if (centreEl) {
      if (p.exam_centre) {
        selectOption(centreEl, p.exam_centre);
      } else {
        if (!selectOption(centreEl, 'Dhaka')) {
          if (centreEl.options.length > 1) {
            centreEl.selectedIndex = 1;
            triggerSelectEvents(centreEl);
          }
        }
      }
      count++;
    }

    // 19. Declaration Checkbox (#info_yes)
    const infoYes = document.getElementById('info_yes') || document.querySelector('[name="info_yes"]');
    if (infoYes && !infoYes.checked) {
      infoYes.checked = true;
      infoYes.dispatchEvent(new Event('click', { bubbles: true }));
      infoYes.dispatchEvent(new Event('change', { bubbles: true }));
      count++;
    }

    // 20. Focus Captcha field (#validation)
    focusCaptchaField();

    return count;
  }

  // =========================================================================
  // MODERN TELETALK FORM FILLING (*.teletalk.com.bd, alljobs)
  // =========================================================================
  async function executeModernTeletalkFill(p) {
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
      const upazilaLoaded = await waitForDropdownOptions('present_upazila', 3000);
      if (upazilaLoaded && p.present_upazila) {
        const upEl = document.getElementById('present_upazila') || document.querySelector('[name="present_upazila"]');
        if (selectOption(upEl, p.present_upazila)) count++;
      }
    }

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
        const permUpLoaded = await waitForDropdownOptions('permanent_upazila', 3000);
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

  // =========================================================================
  // SHARED HELPERS & UTILITIES
  // =========================================================================

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

  // Smart select option matching (exact, synonyms, GPA scale, duration, tokens)
  function selectOption(el, target) {
    if (!el || target === undefined || target === null || target === '') return false;
    const targetStr = String(target).trim().toLowerCase();

    // 1. Direct value match
    for (let i = 0; i < el.options.length; i++) {
      if (el.options[i].value.trim().toLowerCase() === targetStr) {
        el.selectedIndex = i;
        triggerSelectEvents(el);
        return true;
      }
    }

    // 2. Direct text match
    for (let i = 0; i < el.options.length; i++) {
      if (el.options[i].text.trim().toLowerCase() === targetStr) {
        el.selectedIndex = i;
        triggerSelectEvents(el);
        return true;
      }
    }

    // 3. Synonym / Alternative spelling normalization (Bangladesh districts/boards)
    const synonyms = {
      'chattogram': 'chittagong',
      'chittagong': 'chattogram',
      'cumilla': 'comilla',
      'comilla': 'cumilla',
      'jashore': 'jessore',
      'jessore': 'jashore',
      'barishal': 'barisal',
      'barisal': 'barishal',
      'bogura': 'bogra',
      'bogra': 'bogura'
    };
    const syn = synonyms[targetStr];
    if (syn) {
      for (let i = 0; i < el.options.length; i++) {
        const optText = el.options[i].text.trim().toLowerCase();
        if (optText === syn || optText.includes(syn)) {
          el.selectedIndex = i;
          triggerSelectEvents(el);
          return true;
        }
      }
    }

    // 4. Scale 4 / 5 and GPA/CGPA fuzzy match
    const isGpa4 = (targetStr.includes('4') && (targetStr.includes('gpa') || targetStr.includes('scale') || targetStr.includes('out of') || targetStr === '4'));
    const isGpa5 = (targetStr.includes('5') && (targetStr.includes('gpa') || targetStr.includes('scale') || targetStr.includes('out of') || targetStr === '5'));
    if (isGpa4) {
      for (let i = 0; i < el.options.length; i++) {
        const optText = el.options[i].text.trim().toLowerCase();
        if (optText.includes('4') && (optText.includes('gpa') || optText.includes('scale') || optText.includes('out of'))) {
          el.selectedIndex = i;
          triggerSelectEvents(el);
          return true;
        }
      }
    }
    if (isGpa5) {
      for (let i = 0; i < el.options.length; i++) {
        const optText = el.options[i].text.trim().toLowerCase();
        if (optText.includes('5') && (optText.includes('gpa') || optText.includes('scale') || optText.includes('out of'))) {
          el.selectedIndex = i;
          triggerSelectEvents(el);
          return true;
        }
      }
    }

    // 5. Duration (e.g. "4 Years", "04 Years", "4", "4 Year")
    const durationMatch = targetStr.match(/\b([1-5])\b/);
    if (durationMatch && (targetStr.includes('year') || targetStr.length <= 2)) {
      const num = durationMatch[1];
      for (let i = 0; i < el.options.length; i++) {
        const optText = el.options[i].text.trim().toLowerCase();
        const optVal = el.options[i].value.trim();
        if (optVal === num || optVal === '0' + num || (optText.includes(num) && optText.includes('year'))) {
          el.selectedIndex = i;
          triggerSelectEvents(el);
          return true;
        }
      }
    }

    // 6. Substring / contains match
    for (let i = 0; i < el.options.length; i++) {
      const optText = el.options[i].text.trim().toLowerCase();
      if (optText.length > 2 && (optText.includes(targetStr) || targetStr.includes(optText))) {
        el.selectedIndex = i;
        triggerSelectEvents(el);
        return true;
      }
    }

    // 7. Token-based word match (for university/subject names)
    const targetTokens = targetStr.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(t => t.length > 2 && t !== 'and' && t !== 'the');
    if (targetTokens.length > 0) {
      for (let i = 0; i < el.options.length; i++) {
        const optText = el.options[i].text.trim().toLowerCase();
        const matchAll = targetTokens.every(token => optText.includes(token));
        if (matchAll) {
          el.selectedIndex = i;
          triggerSelectEvents(el);
          return true;
        }
      }
    }

    return false;
  }

  function triggerSelectEvents(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    if (typeof el.onchange === 'function') {
      try { el.onchange(); } catch(e) {}
    }
    el.classList.add('tff-field-filled');
  }

  // Poll for AJAX dropdown options (Upazila, subjects, etc.)
  async function waitForDropdownOptions(idOrName, timeoutMs = 3000) {
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
    const captchaEl = document.getElementById('validation') ||
                      document.getElementById('captcha') ||
                      document.querySelector('[name="validation"]') ||
                      document.querySelector('[name="validation_code"]') ||
                      document.querySelector('[name="captcha"]') ||
                      document.querySelector('input[type="text"][placeholder*="captcha" i]') ||
                      document.querySelector('input[type="text"][placeholder*="validation" i]');

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