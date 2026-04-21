document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("message", (event) => {
    const payload = event.data;
    if (!payload || payload.type !== "unit3:h5p-resize") {
      return;
    }

    const iframe = document.querySelector(`iframe[data-h5p-content-id="${payload.contentId}"]`);
    if (iframe instanceof HTMLIFrameElement && Number.isFinite(payload.height)) {
      iframe.style.height = `${Math.max(320, Number(payload.height))}px`;
    }
  });

  const sopAddonStorageKey = "unit3.sopSectionNavigatorEnabled";
  const logbookTabStorageKey = "unit3.logbook.activeTab";
  const sopTemplates = {
    general: `PURPOSE:
Describe the purpose of this SOP and the clinical objective.

SCOPE AND RESPONSIBILITY:
- Unit:
- Primary responsible clinician:
- Supporting team:

REQUIRED EQUIPMENT / PREPARATION:
1. Confirm patient and case context.
2. Prepare equipment and drugs.
3. Verify monitoring and backup plan.

PROCEDURE:
1. Step one
2. Step two
3. Step three

PRECAUTIONS / ESCALATION:
- Safety point:
- Escalation trigger:
- Consultant to be informed when:

DOCUMENTATION:
- What must be recorded:
- Where it should be recorded:

SIGN-OFF / REVIEW:
- SOP owner:
- Effective date:
- Review due date:`,
    airway: `PURPOSE:
Standardize airway preparation and airway intervention workflow for Unit 3.

INDICATIONS:
- Anticipated difficult airway
- Emergency airway support
- Planned advanced airway management

PREPARATION:
1. Check airway cart and backup devices.
2. Confirm suction, oxygen source, and monitoring.
3. Brief team on airway plan and escalation sequence.

PROCEDURE:
1. Position patient and prepare airway equipment.
2. Perform preoxygenation.
3. Proceed with planned airway technique.
4. Confirm placement and ventilation.

FAILED / DIFFICULT AIRWAY RESPONSE:
1. Call for senior help early.
2. Move to backup airway plan.
3. Document all attempts and outcome.

POST-PROCEDURE CARE:
- Confirm stability
- Handover airway concerns
- Update records

PRECAUTIONS:
- Do not delay escalation when difficulty is encountered.
- Maintain continuous monitoring throughout.`,
    icu: `PURPOSE:
Define the ICU workflow for the targeted procedure or care pathway.

PATIENT ELIGIBILITY:
- Inclusion criteria
- Exclusion or caution criteria

PRE-PROCEDURE CHECKS:
1. Review diagnosis and current status.
2. Confirm investigations and monitoring.
3. Ensure drugs, lines, and equipment are ready.

ICU PROCEDURE STEPS:
1. Preparation
2. Intervention
3. Monitoring during procedure
4. Immediate response to complications

POST-PROCEDURE MONITORING:
- Vital observation frequency
- Documentation points
- Handover requirements

ESCALATION:
- Notify consultant when:
- Trigger ICU review when:
- Emergency pathway if deterioration occurs:`,
    safety: `PURPOSE:
Standard safety checklist for the selected unit workflow.

BEFORE STARTING:
1. Confirm identity and indication.
2. Confirm consent / authorization if applicable.
3. Check equipment, drugs, and staffing.

TIME-OUT:
1. Introduce team.
2. State procedure / task.
3. Confirm anticipated risks.

DURING THE PROCEDURE:
- Monitoring requirement:
- Sterility / safety requirement:
- Escalation trigger:

BEFORE COMPLETION:
1. Count / verify critical items.
2. Confirm documentation.
3. Confirm handover plan.

SAFETY ALERTS:
- Red flag 1
- Red flag 2
- Red flag 3`
  };

  const sopSnippets = {
    heading: "\nSECTION TITLE:\n",
    subheading: "\nSubsection:\n",
    numbered: "\n1. First step\n2. Second step\n3. Third step\n",
    bullet: "\n- Item one\n- Item two\n- Item three\n",
    warning: "\nPRECAUTIONS:\n- Safety-critical instruction\n- Escalation condition\n",
    signoff: "\nSIGN-OFF / REVIEW:\n- SOP owner:\n- Approved by:\n- Next review date:\n"
  };

  const renderPreviewHtml = (text) => {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const lines = escaped.split(/\r?\n/);
    let html = "";
    let inList = false;
    let inNumberedList = false;

    const closeLists = () => {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (inNumberedList) {
        html += "</ol>";
        inNumberedList = false;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        closeLists();
        return;
      }

      if (/^[A-Z][A-Z\s/&(),-]{3,}:?$/.test(trimmed)) {
        closeLists();
        html += `<h4>${trimmed.replace(/:$/, "")}</h4>`;
        return;
      }

      if (/^\d+(\.\d+)*[.)-]?\s+/.test(trimmed)) {
        if (!inNumberedList) {
          closeLists();
          html += "<ol>";
          inNumberedList = true;
        }
        html += `<li>${trimmed.replace(/^\d+(\.\d+)*[.)-]?\s+/, "")}</li>`;
        return;
      }

      if (/^- /.test(trimmed)) {
        if (!inList) {
          closeLists();
          html += "<ul>";
          inList = true;
        }
        html += `<li>${trimmed.replace(/^- /, "")}</li>`;
        return;
      }

      closeLists();
      html += `<p>${trimmed}</p>`;
    });

    closeLists();
    return html;
  };

  const flash = document.querySelector(".flash");
  if (flash) {
    setTimeout(() => {
      flash.style.opacity = "0";
      flash.style.transform = "translateY(-6px)";
      flash.style.transition = "opacity 400ms ease, transform 400ms ease";
      setTimeout(() => {
        if (flash.parentNode) {
          flash.parentNode.removeChild(flash);
        }
      }, 420);
    }, 3800);
  }

  const designationSelect = document.querySelector("[data-designation-select]");
  const trainingYearRow = document.querySelector("[data-training-row]");
  const trainingYearField = document.querySelector("[data-training-year-field]");
  const trainingYearSelect = document.querySelector("[data-training-year-select]");

  if (designationSelect instanceof HTMLSelectElement && trainingYearField && trainingYearSelect instanceof HTMLSelectElement) {
    const syncTrainingYearVisibility = () => {
      const shouldShowTrainingYear = designationSelect.value === "Postgraduate";
      trainingYearField.hidden = !shouldShowTrainingYear;
      trainingYearSelect.disabled = !shouldShowTrainingYear;
      trainingYearSelect.required = shouldShowTrainingYear;
      trainingYearRow?.classList.toggle("is-training-hidden", !shouldShowTrainingYear);
      trainingYearRow?.classList.toggle("is-training-visible", shouldShowTrainingYear);

      if (!shouldShowTrainingYear) {
        trainingYearSelect.value = "";
      }
    };

    designationSelect.addEventListener("change", syncTrainingYearVisibility);
    syncTrainingYearVisibility();
  }

  const logbookTabsRoot = document.querySelector("[data-logbook-tabs]");
  if (logbookTabsRoot) {
    const tabButtons = Array.from(logbookTabsRoot.querySelectorAll("[data-logbook-tab]"));
    const panels = Array.from(logbookTabsRoot.querySelectorAll("[data-logbook-panel]"));
    const jumpButtons = Array.from(document.querySelectorAll("[data-logbook-jump-tab]"));

    const activateLogbookTab = (tabKey) => {
      const hasTarget = panels.some((panel) => panel.getAttribute("data-logbook-panel") === tabKey);
      const resolvedTab = hasTarget ? tabKey : panels[0]?.getAttribute("data-logbook-panel");

      if (!resolvedTab) {
        return;
      }

      tabButtons.forEach((button) => {
        const isActive = button.getAttribute("data-logbook-tab") === resolvedTab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.getAttribute("data-logbook-panel") === resolvedTab;
        panel.hidden = !isActive;
      });

      window.localStorage.setItem(logbookTabStorageKey, resolvedTab);
    };

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activateLogbookTab(button.getAttribute("data-logbook-tab"));
      });
    });

    jumpButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activateLogbookTab(button.getAttribute("data-logbook-jump-tab"));
        logbookTabsRoot.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    const storedTab = window.localStorage.getItem(logbookTabStorageKey);
    const queryParams = new URLSearchParams(window.location.search);
    const browserQueryKeys = ["entrySearch", "entryCaseType", "entryDepartment", "entryFlagged"];
    const oversightQueryKeys = ["teamEntrySearch", "teamEntryCaseType", "teamEntryDepartment", "teamEntryFlagged", "teamView"];
    const requestedBrowserTab = browserQueryKeys.some((key) => queryParams.has(key)) ? "entries" : "";
    const requestedTeamView = queryParams.get("teamView");
    const requestedOversightTab =
      oversightQueryKeys.some((key) => queryParams.has(key)) && requestedTeamView !== "involved" ? "oversight" : "";
    const requestedInvolvedTab = requestedTeamView === "involved" ? "involved" : "";
    activateLogbookTab(requestedInvolvedTab || requestedOversightTab || requestedBrowserTab || storedTab);
  }

  // ── Logbook fieldset accordion (mobile only, <= 780px) ─────────
  const isMobileBreakpoint = () => window.matchMedia("(max-width: 780px)").matches;
  const logbookFieldsets = document.querySelectorAll(".form-section-card");

  if (logbookFieldsets.length) {
    logbookFieldsets.forEach((fs, i) => {
      const legend = fs.querySelector("legend");
      if (!legend) return;

      legend.setAttribute("role", "button");
      legend.setAttribute("tabindex", "0");
      legend.setAttribute("aria-expanded", "true");

      const toggle = () => {
        if (!isMobileBreakpoint()) {
          return;
        }

        fs.dataset.logbookAccordionTouched = "true";
        const nowCollapsed = fs.classList.toggle("is-collapsed");
        legend.setAttribute("aria-expanded", nowCollapsed ? "false" : "true");
      };

      legend.addEventListener("click", toggle);
      legend.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    });

    const syncLogbookAccordion = () => {
      const mobile = isMobileBreakpoint();
      logbookFieldsets.forEach((fs, index) => {
        const legend = fs.querySelector("legend");
        if (!legend) {
          return;
        }

        if (!mobile) {
          fs.classList.remove("is-collapsed");
          legend.setAttribute("aria-expanded", "true");
          return;
        }

        if (fs.dataset.logbookAccordionTouched === "true") {
          legend.setAttribute("aria-expanded", String(!fs.classList.contains("is-collapsed")));
          return;
        }

        const shouldCollapse = index > 0;
        fs.classList.toggle("is-collapsed", shouldCollapse);
        legend.setAttribute("aria-expanded", shouldCollapse ? "false" : "true");
      });
    };

    syncLogbookAccordion();
    window.matchMedia("(max-width: 780px)").addEventListener("change", syncLogbookAccordion);

    // Auto-expand collapsed fieldsets containing invalid required fields on submit
    const logbookForm = document.querySelector(".logbook-entry-form");
    if (logbookForm) {
      logbookForm.addEventListener("submit", () => {
        logbookFieldsets.forEach((fs) => {
          if (fs.classList.contains("is-collapsed")) {
            const hasInvalid = Array.from(
              fs.querySelectorAll("input, select, textarea")
            ).some((el) => !el.checkValidity());

            if (hasInvalid) {
              fs.classList.remove("is-collapsed");
              const legend = fs.querySelector("legend");
              if (legend) legend.setAttribute("aria-expanded", "true");
            }
          }
        });
      });
    }
  }

  const logbookBlueprintForm = document.querySelector("[data-logbook-blueprint-form]");
  if (logbookBlueprintForm) {
    const startTimeInput = logbookBlueprintForm.querySelector("[data-logbook-start-time]");
    const endTimeInput = logbookBlueprintForm.querySelector("[data-logbook-end-time]");
    const durationLabel = logbookBlueprintForm.querySelector("[data-logbook-duration-label]");
    const anaestheticPlanSelect = logbookBlueprintForm.querySelector("[data-logbook-anaesthetic-plan]");
    const airwayWrapper = logbookBlueprintForm.querySelector("[data-logbook-airway-wrapper]");
    const airwaySelect = logbookBlueprintForm.querySelector("[data-logbook-airway-select]");
    const scopyWrapper = logbookBlueprintForm.querySelector("[data-logbook-scopy-wrapper]");
    const scopySelect = logbookBlueprintForm.querySelector("[data-logbook-scopy-select]");
    const otherComorbidityToggle = logbookBlueprintForm.querySelector("[data-logbook-other-comorbidity-toggle]");
    const otherComorbidityRow = logbookBlueprintForm.querySelector("[data-logbook-other-comorbidity-row]");
    const otherComorbidityInput = otherComorbidityRow?.querySelector("input");
    const repeatableLists = Array.from(logbookBlueprintForm.querySelectorAll("[data-repeatable-list]"));
    const repeatableAddButtons = Array.from(logbookBlueprintForm.querySelectorAll("[data-repeatable-add]"));
    const additionalMemberRoot = logbookBlueprintForm.querySelector("[data-additional-member-root]");
    const additionalMemberList = logbookBlueprintForm.querySelector("[data-additional-member-list]");
    const additionalMemberEmpty = logbookBlueprintForm.querySelector("[data-additional-member-empty]");
    const additionalMemberAddButton = logbookBlueprintForm.querySelector("[data-additional-member-add]");
    const additionalMemberSuggestions = Array.from(document.querySelectorAll("#unit-member-suggestions option"));

    const calculateDurationLabel = () => {
      if (!(startTimeInput instanceof HTMLInputElement) || !(endTimeInput instanceof HTMLInputElement) || !durationLabel) {
        return;
      }

      if (!startTimeInput.value || !endTimeInput.value) {
        durationLabel.textContent = "Auto-calculated when start and end time are entered.";
        return;
      }

      const [startHour, startMinute] = startTimeInput.value.split(":").map(Number);
      const [endHour, endMinute] = endTimeInput.value.split(":").map(Number);
      const startTotal = startHour * 60 + startMinute;
      const endTotal = endHour * 60 + endMinute;
      const rawDifference = endTotal - startTotal;
      const minutes = rawDifference >= 0 ? rawDifference : 24 * 60 + rawDifference;
      const hours = Math.floor(minutes / 60);
      const remainder = minutes % 60;
      const parts = [];

      if (hours > 0) {
        parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
      }
      if (remainder > 0 || hours === 0) {
        parts.push(`${remainder} min`);
      }

      durationLabel.textContent = `Estimated duration: ${parts.join(" ")}`;
    };

    const syncAnaesthesiaVisibility = () => {
      if (!(anaestheticPlanSelect instanceof HTMLSelectElement) || !(airwaySelect instanceof HTMLSelectElement) || !(scopySelect instanceof HTMLSelectElement)) {
        return;
      }

      const needsAirway = anaestheticPlanSelect.value === "GA - Inhalational/TIVA";
      const needsScopy = needsAirway && airwaySelect.value === "ETT";

      if (airwayWrapper) {
        airwayWrapper.hidden = !needsAirway;
      }
      airwaySelect.required = needsAirway;
      airwaySelect.disabled = !needsAirway;
      if (!needsAirway) {
        airwaySelect.value = "";
      }

      if (scopyWrapper) {
        scopyWrapper.hidden = !needsScopy;
      }
      scopySelect.required = needsScopy;
      scopySelect.disabled = !needsScopy;
      if (!needsScopy) {
        scopySelect.value = "";
      }
    };

    const syncOtherComorbidityVisibility = () => {
      if (!(otherComorbidityToggle instanceof HTMLInputElement) || !(otherComorbidityInput instanceof HTMLInputElement) || !otherComorbidityRow) {
        return;
      }

      const isVisible = otherComorbidityToggle.checked;
      otherComorbidityRow.hidden = !isVisible;
      otherComorbidityInput.required = isVisible;
      if (!isVisible) {
        otherComorbidityInput.value = "";
      }
    };

    const refreshRepeatableList = (list) => {
      const rows = Array.from(list.querySelectorAll(".repeatable-row"));
      const labelBase = list.dataset.repeatableLabel || "Item";
      const inputName = list.dataset.repeatableInputName || "items";
      const placeholder = list.dataset.repeatablePlaceholder || "";
      const requireFirst = list.dataset.repeatableRequired === "true";
      const numbered = labelBase === "Learning point";

      rows.forEach((row, index) => {
        const labelSpan = row.querySelector("label span");
        const input = row.querySelector("input");
        const removeButton = row.querySelector("[data-repeatable-remove]");

        if (labelSpan) {
          labelSpan.textContent = numbered ? `${labelBase} ${index + 1}` : labelBase;
        }

        if (input instanceof HTMLInputElement) {
          input.name = inputName;
          input.placeholder = placeholder;
          input.required = requireFirst && index === 0;
        }

        if (removeButton instanceof HTMLButtonElement) {
          removeButton.hidden = rows.length === 1;
        }
      });
    };

    const createRepeatableRow = (list) => {
      const row = document.createElement("div");
      row.className = "repeatable-row";

      const label = document.createElement("label");
      const labelSpan = document.createElement("span");
      const input = document.createElement("input");
      const removeButton = document.createElement("button");

      label.appendChild(labelSpan);
      input.type = "text";
      label.appendChild(input);

      removeButton.type = "button";
      removeButton.className = "button-link button-link-secondary repeatable-remove";
      removeButton.setAttribute("data-repeatable-remove", "");
      removeButton.textContent = "Remove";

      row.appendChild(label);
      row.appendChild(removeButton);
      list.appendChild(row);
      refreshRepeatableList(list);
      input.focus();
    };

    repeatableLists.forEach((list) => {
      refreshRepeatableList(list);
      list.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
          return;
        }

        const removeButton = event.target.closest("[data-repeatable-remove]");
        if (!(removeButton instanceof HTMLButtonElement)) {
          return;
        }

        const row = removeButton.closest(".repeatable-row");
        if (!row) {
          return;
        }

        row.remove();
        if (!list.querySelector(".repeatable-row")) {
          createRepeatableRow(list);
        }
        refreshRepeatableList(list);
      });
    });

    repeatableAddButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-repeatable-target");
        if (!targetId) {
          return;
        }

        const list = logbookBlueprintForm.querySelector(`#${targetId}`);
        if (list) {
          createRepeatableRow(list);
        }
      });
    });

    const memberLabelToId = new Map(
      additionalMemberSuggestions
        .map((option) => [option.value.trim(), option.getAttribute("data-member-id") || ""])
        .filter(([, memberId]) => memberId)
    );

    const syncAdditionalMemberEmptyState = () => {
      if (!additionalMemberList || !additionalMemberEmpty) {
        return;
      }

      const hasRows = Boolean(additionalMemberList.querySelector(".repeatable-member-row"));
      additionalMemberEmpty.hidden = hasRows;
      additionalMemberRoot?.classList.toggle("has-members", hasRows);
    };

    const syncAdditionalMemberRow = (row) => {
      const label = row.querySelector("[data-additional-member-label]");
      const displayInput = row.querySelector("[data-additional-member-display]");
      const hiddenInput = row.querySelector("[data-additional-member-id]");
      const hint = row.querySelector("[data-additional-member-hint]");
      const rows = additionalMemberList ? Array.from(additionalMemberList.querySelectorAll(".repeatable-member-row")) : [];
      const index = rows.indexOf(row);

      if (label) {
        label.textContent = `Additional member ${index + 1}`;
      }

      if (!(displayInput instanceof HTMLInputElement) || !(hiddenInput instanceof HTMLInputElement)) {
        return;
      }

      const selectedLabel = displayInput.value.trim();
      const selectedId = memberLabelToId.get(selectedLabel) || "";
      hiddenInput.name = "additionalMemberIds";
      hiddenInput.value = selectedId;

      if (selectedLabel && !selectedId) {
        displayInput.setCustomValidity("Choose a registered unit member from the suggestions.");
      } else {
        displayInput.setCustomValidity("");
      }

      if (hint) {
        hint.textContent = selectedId
          ? "This member will be able to open the case after it is saved."
          : "Start typing a name, designation, or @username and choose a suggestion.";
      }
    };

    const buildAdditionalMemberRow = () => {
      if (!(additionalMemberList instanceof HTMLElement)) {
        return;
      }

      const row = document.createElement("div");
      row.className = "repeatable-row repeatable-member-row";

      const fields = document.createElement("div");
      fields.className = "repeatable-member-fields";

      const label = document.createElement("label");
      label.className = "repeatable-member-picker";
      const labelSpan = document.createElement("span");
      labelSpan.setAttribute("data-additional-member-label", "");

      const displayInput = document.createElement("input");
      displayInput.type = "text";
      displayInput.setAttribute("list", "unit-member-suggestions");
      displayInput.setAttribute("placeholder", "Start typing a name, designation, or @username");
      displayInput.setAttribute("autocomplete", "off");
      displayInput.setAttribute("data-additional-member-display", "");

      const hiddenInput = document.createElement("input");
      hiddenInput.type = "hidden";
      hiddenInput.setAttribute("data-additional-member-id", "");

      const hint = document.createElement("p");
      hint.className = "meta-text repeatable-member-hint";
      hint.setAttribute("data-additional-member-hint", "");

      label.appendChild(labelSpan);
      label.appendChild(displayInput);
      fields.appendChild(label);
      fields.appendChild(hiddenInput);
      fields.appendChild(hint);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "button-link button-link-secondary repeatable-remove";
      removeButton.setAttribute("data-additional-member-remove", "");
      removeButton.textContent = "Remove";

      row.appendChild(fields);
      row.appendChild(removeButton);
      additionalMemberList.appendChild(row);

      displayInput.addEventListener("input", () => syncAdditionalMemberRow(row));
      displayInput.addEventListener("change", () => syncAdditionalMemberRow(row));
      displayInput.addEventListener("blur", () => syncAdditionalMemberRow(row));

      syncAdditionalMemberRow(row);
      syncAdditionalMemberEmptyState();
      displayInput.focus();
    };

    if (additionalMemberAddButton instanceof HTMLButtonElement) {
      additionalMemberAddButton.addEventListener("click", buildAdditionalMemberRow);
    }

    if (additionalMemberList instanceof HTMLElement) {
      additionalMemberList.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
          return;
        }

        const removeButton = event.target.closest("[data-additional-member-remove]");
        if (!(removeButton instanceof HTMLButtonElement)) {
          return;
        }

        const row = removeButton.closest(".repeatable-member-row");
        if (!row) {
          return;
        }

        row.remove();
        Array.from(additionalMemberList.querySelectorAll(".repeatable-member-row")).forEach((memberRow) => {
          syncAdditionalMemberRow(memberRow);
        });
        syncAdditionalMemberEmptyState();
      });
    }

    syncAdditionalMemberEmptyState();

    startTimeInput?.addEventListener("input", calculateDurationLabel);
    endTimeInput?.addEventListener("input", calculateDurationLabel);
    anaestheticPlanSelect?.addEventListener("change", syncAnaesthesiaVisibility);
    airwaySelect?.addEventListener("change", syncAnaesthesiaVisibility);
    otherComorbidityToggle?.addEventListener("change", syncOtherComorbidityVisibility);
    logbookBlueprintForm.addEventListener("submit", () => {
      if (!(additionalMemberList instanceof HTMLElement)) {
        return;
      }

      Array.from(additionalMemberList.querySelectorAll(".repeatable-member-row")).forEach((row) => {
        syncAdditionalMemberRow(row);
      });
    });

    calculateDurationLabel();
    syncAnaesthesiaVisibility();
    syncOtherComorbidityVisibility();
  }

  const logbookCaseModal = document.querySelector("[data-logbook-case-modal]");
  if (logbookCaseModal) {
    const caseViewButtons = Array.from(document.querySelectorAll("[data-logbook-case-view]"));
    const closeButtons = Array.from(logbookCaseModal.querySelectorAll("[data-logbook-case-modal-close]"));
    let lastCaseTrigger = null;

    const setModalText = (selector, value) => {
      const target = logbookCaseModal.querySelector(selector);
      if (target) {
        target.textContent = value && value.trim() ? value : "-";
      }
    };

    const openCaseModal = (button) => {
      lastCaseTrigger = button;
      const data = button.dataset;

      setModalText("[data-case-modal-owner]", data.caseOwner);
      setModalText("[data-case-modal-title]", data.caseTitle);
      setModalText("[data-case-modal-number]", data.caseNumber);
      setModalText("[data-case-modal-date]", data.caseDate);
      setModalText("[data-case-modal-type]", data.caseType);
      setModalText("[data-case-modal-department]", data.caseDepartment);
      setModalText("[data-case-modal-ot]", data.caseOt);
      setModalText("[data-case-modal-time]", data.caseTime);
      setModalText("[data-case-modal-duration]", data.caseDuration);
      setModalText("[data-case-modal-age]", data.caseAge);
      setModalText("[data-case-modal-gender]", data.caseGender);
      setModalText("[data-case-modal-asa]", data.caseAsa);
      setModalText("[data-case-modal-bmi]", data.caseBmi);
      setModalText("[data-case-modal-plan]", data.casePlan);
      setModalText("[data-case-modal-supervision]", data.caseSupervision);
      setModalText("[data-case-modal-airway]", data.caseAirway);
      setModalText("[data-case-modal-scopy]", data.caseScopy);
      setModalText("[data-case-modal-members]", data.caseMembers);
      setModalText("[data-case-modal-postop]", data.casePostop);
      setModalText("[data-case-modal-comorbidities]", data.caseComorbidities);
      setModalText("[data-case-modal-procedures]", data.caseProcedures);
      setModalText("[data-case-modal-analgesia]", data.caseAnalgesia);
      setModalText("[data-case-modal-events]", data.caseEvents);
      setModalText("[data-case-modal-learning]", data.caseLearning);

      logbookCaseModal.hidden = false;
      document.body.classList.add("modal-open");
      const closeButton = logbookCaseModal.querySelector("[data-logbook-case-modal-close]");
      if (closeButton instanceof HTMLElement) {
        closeButton.focus();
      }
    };

    const closeCaseModal = () => {
      logbookCaseModal.hidden = true;
      document.body.classList.remove("modal-open");
      if (lastCaseTrigger instanceof HTMLElement) {
        lastCaseTrigger.focus();
      }
    };

    caseViewButtons.forEach((button) => {
      button.addEventListener("click", () => openCaseModal(button));
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", closeCaseModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !logbookCaseModal.hidden) {
        closeCaseModal();
      }
    });
  }

  const adminTabStorageKey = "unit3.admin.activeTab";
  const adminTabsRoot = document.querySelector("[data-admin-tabs]");
  if (adminTabsRoot) {
    const tabButtons = Array.from(adminTabsRoot.querySelectorAll("[data-admin-tab]"));
    const panels = Array.from(adminTabsRoot.querySelectorAll("[data-admin-panel]"));

    const activateAdminTab = (tabKey) => {
      const hasTarget = panels.some((panel) => panel.getAttribute("data-admin-panel") === tabKey);
      const resolvedTab = hasTarget ? tabKey : panels[0]?.getAttribute("data-admin-panel");

      if (!resolvedTab) {
        return;
      }

      tabButtons.forEach((button) => {
        const isActive = button.getAttribute("data-admin-tab") === resolvedTab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.getAttribute("data-admin-panel") === resolvedTab;
        panel.hidden = !isActive;
      });

      window.localStorage.setItem(adminTabStorageKey, resolvedTab);
    };

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activateAdminTab(button.getAttribute("data-admin-tab"));
      });
    });

    const storedTab = window.localStorage.getItem(adminTabStorageKey);
    activateAdminTab(storedTab);
  }

  const caseWorkspaceTabStorageKey = "unit3.cases.activeTab";
  const caseWorkspaceRoot = document.querySelector("[data-case-workspace-tabs]");
  if (caseWorkspaceRoot) {
    const tabButtons = Array.from(caseWorkspaceRoot.querySelectorAll("[data-case-workspace-tab]"));
    const panels = Array.from(caseWorkspaceRoot.querySelectorAll("[data-case-workspace-panel]"));

    const activateCaseWorkspaceTab = (tabKey) => {
      const hasTarget = panels.some((panel) => panel.getAttribute("data-case-workspace-panel") === tabKey);
      const resolvedTab = hasTarget ? tabKey : panels[0]?.getAttribute("data-case-workspace-panel");

      if (!resolvedTab) {
        return;
      }

      tabButtons.forEach((button) => {
        const isActive = button.getAttribute("data-case-workspace-tab") === resolvedTab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.getAttribute("data-case-workspace-panel") === resolvedTab;
        panel.hidden = !isActive;
      });

      window.localStorage.setItem(caseWorkspaceTabStorageKey, resolvedTab);
    };

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activateCaseWorkspaceTab(button.getAttribute("data-case-workspace-tab"));
      });
    });

    activateCaseWorkspaceTab(window.localStorage.getItem(caseWorkspaceTabStorageKey));
  }

  const caseSubmissionForm = document.querySelector("[data-case-submission-form]");
  if (caseSubmissionForm instanceof HTMLFormElement) {
    const caseDraftStorageKey = "unit3.cases.localDraft";
    const caseStepStorageKey = "unit3.cases.activeStep";
    const stepButtons = Array.from(caseSubmissionForm.querySelectorAll("[data-case-step-tab]"));
    const stepPanels = Array.from(caseSubmissionForm.querySelectorAll("[data-case-step-panel]"));
    const nextButtons = Array.from(caseSubmissionForm.querySelectorAll("[data-case-next-step]"));
    const prevButtons = Array.from(caseSubmissionForm.querySelectorAll("[data-case-prev-step]"));
    const clearDraftButton = caseSubmissionForm.querySelector("[data-case-clear-draft]");
    const draftStatus = document.querySelector("[data-case-draft-status]");
    const privacyWarning = caseSubmissionForm.querySelector("[data-case-privacy-warning]");
    const privacyFields = Array.from(caseSubmissionForm.querySelectorAll("[data-case-privacy-field]"));
    const templateButtons = Array.from(caseSubmissionForm.querySelectorAll("[data-case-template]"));
    const stepKeys = stepPanels.map((panel) => panel.getAttribute("data-case-step-panel")).filter(Boolean);

    const caseTemplates = {
      routine: {
        title: "De-identified routine learning case",
        subtitle: "Useful learning from a routine case",
        learningPoints: "1. \n2. \n3. ",
        whyThisCaseMatters: "This case is useful because it highlights a common decision or practical point.",
        keyDecisionPoints: "Decision point 1:\nDecision point 2:",
        takeHomePoints: "Practical takeaway 1:\nPractical takeaway 2:",
        complexityLevel: "routine"
      },
      critical: {
        title: "De-identified critical event case",
        subtitle: "Recognition, response, and learning from a critical event",
        learningPoints: "1. Early recognition:\n2. Escalation:\n3. Follow-up:",
        whyThisCaseMatters: "This case should be discussed because it involved a critical event or near miss.",
        keyDecisionPoints: "Recognition:\nImmediate response:\nEscalation:\nPost-event care:",
        whatWentWell: "What helped the team respond effectively:",
        whatCouldImprove: "What should be improved next time:",
        hadCriticalEvent: "yes",
        complexityLevel: "critical_event"
      },
      airway: {
        title: "De-identified airway case",
        subtitle: "Airway planning, execution, and escalation",
        learningPoints: "1. Airway assessment:\n2. Primary plan:\n3. Backup plan:",
        whyThisCaseMatters: "This case is useful for airway planning and team preparation.",
        keyDecisionPoints: "Airway plan chosen:\nBackup strategy:\nEscalation trigger:",
        anaesthesiaTechnique: "airway_management",
        tags: "airway, planning, escalation"
      },
      regional: {
        title: "De-identified regional anaesthesia case",
        subtitle: "Block choice, safety, and perioperative benefit",
        learningPoints: "1. Indication:\n2. Safety check:\n3. Outcome:",
        whyThisCaseMatters: "This case is useful for discussing regional anaesthesia selection and safety.",
        keyDecisionPoints: "Block choice:\nRisk discussion:\nBackup analgesia plan:",
        anaesthesiaTechnique: "regional_anaesthesia",
        tags: "regional anaesthesia, analgesia"
      },
      icu: {
        title: "De-identified ICU crossover case",
        subtitle: "Perioperative or ICU-linked decision-making",
        learningPoints: "1. Physiological issue:\n2. Team decision:\n3. Handover point:",
        whyThisCaseMatters: "This case connects anaesthesia decision-making with ICU care.",
        keyDecisionPoints: "Stabilisation:\nProcedure timing:\nHandover or escalation:",
        specialtyArea: "icu",
        setting: "icu",
        anaesthesiaTechnique: "icu_procedure",
        tags: "icu, handover, escalation"
      }
    };

    const activateCaseStep = (stepKey) => {
      const resolvedStep = stepKeys.includes(stepKey) ? stepKey : stepKeys[0];

      stepButtons.forEach((button) => {
        const isActive = button.getAttribute("data-case-step-tab") === resolvedStep;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      stepPanels.forEach((panel) => {
        const isActive = panel.getAttribute("data-case-step-panel") === resolvedStep;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });

      window.localStorage.setItem(caseStepStorageKey, resolvedStep);
    };

    const serializeCaseForm = () => {
      const formData = new FormData(caseSubmissionForm);
      const draft = {};

      for (const [key, value] of formData.entries()) {
        if (draft[key]) {
          draft[key] = Array.isArray(draft[key]) ? [...draft[key], value] : [draft[key], value];
        } else {
          draft[key] = value;
        }
      }

      return draft;
    };

    const setFieldValue = (field, value) => {
      if (field instanceof HTMLSelectElement && field.multiple) {
        const selectedValues = Array.isArray(value) ? value.map(String) : [String(value)];
        Array.from(field.options).forEach((option) => {
          option.selected = selectedValues.includes(option.value);
        });
        return;
      }

      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
        field.value = String(value ?? "");
      }
    };

    const restoreCaseDraft = () => {
      const stored = window.localStorage.getItem(caseDraftStorageKey);
      if (!stored) {
        return;
      }

      try {
        const draft = JSON.parse(stored);
        Object.entries(draft).forEach(([key, value]) => {
          const field = caseSubmissionForm.elements.namedItem(key);
          if (!field) {
            return;
          }

          if (field instanceof RadioNodeList) {
            Array.from(field).forEach((item) => setFieldValue(item, value));
            return;
          }

          setFieldValue(field, value);
        });

        if (draftStatus) {
          draftStatus.textContent = "Local draft restored";
        }
      } catch (_error) {
        window.localStorage.removeItem(caseDraftStorageKey);
      }
    };

    const updateDraftStatus = (message) => {
      if (draftStatus) {
        draftStatus.textContent = message;
      }
    };

    const saveCaseDraft = () => {
      window.localStorage.setItem(caseDraftStorageKey, JSON.stringify(serializeCaseForm()));
      updateDraftStatus(`Draft saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    };

    const checkPrivacyWarnings = () => {
      const riskyPattern =
        /\b(?:mrd|ip|uhid|hospital\s*number|bed\s*(?:no|number)|dob|date\s*of\s*birth|patient\s*name)\b/i;
      const longNumberPattern = /\b\d{5,}\b/;
      const datePattern = /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/;
      let hasRisk = false;

      privacyFields.forEach((field) => {
        const text = field.value || "";
        const fieldHasRisk = riskyPattern.test(text) || longNumberPattern.test(text) || datePattern.test(text);
        field.classList.toggle("has-privacy-risk", fieldHasRisk);
        hasRisk = hasRisk || fieldHasRisk;
      });

      if (privacyWarning) {
        privacyWarning.hidden = !hasRisk;
      }
    };

    const currentStepIndex = () => {
      const activePanel = stepPanels.find((panel) => panel.classList.contains("is-active"));
      return Math.max(0, stepKeys.indexOf(activePanel?.getAttribute("data-case-step-panel")));
    };

    stepButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activateCaseStep(button.getAttribute("data-case-step-tab"));
      });
    });

    nextButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activateCaseStep(stepKeys[Math.min(currentStepIndex() + 1, stepKeys.length - 1)]);
      });
    });

    prevButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activateCaseStep(stepKeys[Math.max(currentStepIndex() - 1, 0)]);
      });
    });

    templateButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const templateKey = button.getAttribute("data-case-template");
        const template = templateKey ? caseTemplates[templateKey] : null;
        if (!template) {
          return;
        }

        const hasExistingDraft = Object.values(serializeCaseForm()).some((value) =>
          Array.isArray(value) ? value.length : String(value || "").trim()
        );

        if (hasExistingDraft && !window.confirm("Apply this template to the current case draft? Existing matching fields may be replaced.")) {
          return;
        }

        Object.entries(template).forEach(([key, value]) => {
          const field = caseSubmissionForm.elements.namedItem(key);
          if (field) {
            setFieldValue(field, value);
          }
        });

        saveCaseDraft();
        checkPrivacyWarnings();
      });
    });

    clearDraftButton?.addEventListener("click", () => {
      window.localStorage.removeItem(caseDraftStorageKey);
      caseSubmissionForm.reset();
      checkPrivacyWarnings();
      updateDraftStatus("Local draft cleared");
      activateCaseStep("basic");
    });

    caseSubmissionForm.addEventListener("input", () => {
      saveCaseDraft();
      checkPrivacyWarnings();
    });
    caseSubmissionForm.addEventListener("change", () => {
      saveCaseDraft();
      checkPrivacyWarnings();
    });
    caseSubmissionForm.addEventListener("submit", () => {
      window.localStorage.removeItem(caseDraftStorageKey);
    });

    restoreCaseDraft();
    checkPrivacyWarnings();
    activateCaseStep(window.localStorage.getItem(caseStepStorageKey));
  }

  const teamViewForm = document.querySelector("[data-team-view-form]");
  if (teamViewForm instanceof HTMLFormElement) {
    const teamViewInputs = teamViewForm.querySelectorAll('input[name="teamView"]');

    teamViewInputs.forEach((input) => {
      input.addEventListener("change", () => {
        teamViewForm.requestSubmit();
      });
    });
  }

  const cards = document.querySelectorAll(".list-card");
  if ("IntersectionObserver" in window && cards.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateX(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
    );

    cards.forEach((card, index) => {
      card.style.opacity = "0";
      card.style.transform = "translateX(-10px)";
      card.style.transition = `opacity 280ms ease ${index * 40}ms, transform 280ms ease ${index * 40}ms`;
      observer.observe(card);
    });
  }

  const sopModal = document.querySelector("#sop-modal");
  const sopModalBody = sopModal?.querySelector("[data-sop-modal-body]");
  const sopModalClose = sopModal?.querySelector("[data-sop-modal-close]");
  const sopAddonToggle = sopModal?.querySelector("[data-sop-addon-toggle]");
  const sopTriggers = document.querySelectorAll("[data-sop-modal-trigger]");

  if (sopModal && sopModalBody && "showModal" in sopModal && sopTriggers.length) {
    const isSopAddonEnabled = () => window.localStorage.getItem(sopAddonStorageKey) === "true";

    const updateSopAddonButton = () => {
      if (!sopAddonToggle) {
        return;
      }

      sopAddonToggle.textContent = isSopAddonEnabled()
        ? "Disable section navigator"
        : "Enable section navigator";
    };

    const closeModal = () => {
      if (sopModal.open) {
        sopModal.close();
      }
    };

    const setLoadingState = () => {
      sopModalBody.innerHTML = `
        <div class="sop-modal-loading">
          <span class="iconify" data-icon="ph:spinner-gap-bold"></span>
          Loading SOP...
        </div>
      `;
    };

    const extractSectionsFromText = (text) => {
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const isHeading = (line) => {
        if (line.length > 90) {
          return false;
        }

        return (
          /:$/.test(line) ||
          /^\d+(\.\d+)*[.)-]?\s+[A-Za-z]/.test(line) ||
          /^[A-Z][A-Z\s/&(),-]{4,}$/.test(line)
        );
      };

      const sections = [];
      let currentSection = null;

      lines.forEach((line) => {
        if (isHeading(line)) {
          if (currentSection && currentSection.body.length) {
            sections.push(currentSection);
          }

          currentSection = {
            title: line.replace(/:$/, ""),
            body: []
          };
          return;
        }

        if (!currentSection) {
          currentSection = {
            title: "Overview",
            body: []
          };
        }

        currentSection.body.push(line);
      });

      if (currentSection && currentSection.body.length) {
        sections.push(currentSection);
      }

      return sections.length >= 3 ? sections : [];
    };

    const renderSectionNavigator = () => {
      if (!isSopAddonEnabled()) {
        return;
      }

      const readingSurface = sopModalBody.querySelector(".sop-reading-surface");
      const sopContent = readingSurface?.querySelector(".sop-content");

      if (!readingSurface || !sopContent || readingSurface.dataset.sectionsEnhanced === "true") {
        return;
      }

      const sections = extractSectionsFromText(sopContent.textContent || "");
      if (!sections.length) {
        return;
      }

      readingSurface.dataset.sectionsEnhanced = "true";
      sopContent.hidden = true;

      const readerLayout = document.createElement("div");
      readerLayout.className = "sop-reader-layout";

      const nav = document.createElement("nav");
      nav.className = "sop-section-nav";
      nav.setAttribute("aria-label", "SOP section navigator");

      const navTitle = document.createElement("strong");
      navTitle.textContent = "Quick section navigator";
      nav.appendChild(navTitle);

      const navList = document.createElement("div");
      navList.className = "sop-section-nav-list";

      const article = document.createElement("div");
      article.className = "sop-section-article";

      sections.forEach((section, index) => {
        const id = `sop-section-${index + 1}`;

        const navLink = document.createElement("a");
        navLink.href = `#${id}`;
        navLink.textContent = section.title;
        navList.appendChild(navLink);

        const sectionCard = document.createElement("section");
        sectionCard.className = "sop-section-card";
        sectionCard.id = id;

        const heading = document.createElement("h4");
        heading.textContent = section.title;
        sectionCard.appendChild(heading);

        section.body.forEach((paragraphText) => {
          const paragraph = document.createElement("p");
          paragraph.textContent = paragraphText;
          sectionCard.appendChild(paragraph);
        });

        article.appendChild(sectionCard);
      });

      nav.appendChild(navList);
      readerLayout.appendChild(nav);
      readerLayout.appendChild(article);
      readingSurface.appendChild(readerLayout);
    };

    const loadModalContent = async (trigger) => {
      const url = trigger.getAttribute("data-sop-modal-url");
      if (!url) {
        window.location.href = trigger.getAttribute("href") || "/documents";
        return;
      }

      document
        .querySelectorAll("[data-sop-modal-trigger][aria-current='true']")
        .forEach((item) => item.removeAttribute("aria-current"));
      trigger.setAttribute("aria-current", "true");

      setLoadingState();
      sopModal.showModal();
      document.body.classList.add("modal-open");

      try {
        const response = await fetch(url, {
          headers: { "X-Requested-With": "fetch" }
        });

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const html = await response.text();
        sopModalBody.innerHTML = html;
        renderSectionNavigator();
      } catch (_error) {
        sopModalBody.innerHTML = `
          <div class="sop-modal-error">
            <p class="eyebrow">Viewer unavailable</p>
            <h2>The SOP could not be loaded</h2>
            <p class="section-copy">Please try again, or open the full SOP page instead.</p>
          </div>
        `;
      }
    };

    sopTriggers.forEach((trigger) => {
      trigger.addEventListener("click", async (event) => {
        event.preventDefault();
        await loadModalContent(trigger);
      });
    });

    sopAddonToggle?.addEventListener("click", async () => {
      const nextValue = !isSopAddonEnabled();
      window.localStorage.setItem(sopAddonStorageKey, String(nextValue));
      updateSopAddonButton();

      const activeTrigger = document.querySelector("[data-sop-modal-trigger][aria-current='true']");
      if (sopModal.open && activeTrigger) {
        await loadModalContent(activeTrigger);
      }
    });

    sopModalClose?.addEventListener("click", closeModal);
    sopModal.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      document
        .querySelectorAll("[data-sop-modal-trigger][aria-current='true']")
        .forEach((trigger) => trigger.removeAttribute("aria-current"));
    });

    sopModal.addEventListener("click", (event) => {
      const bounds = sopModal.getBoundingClientRect();
      const clickedOutside =
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom;

      if (clickedOutside) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    });

    updateSopAddonButton();
  }

  const composer = document.querySelector("[data-sop-composer]");
  const composerEditor = composer?.querySelector("[data-sop-editor]");
  const composerPreview = composer?.querySelector("[data-sop-preview]");
  const composerPreviewTabs = composer?.querySelectorAll("[data-sop-preview-tab]");
  const composerPreviewPanels = composer?.querySelectorAll("[data-sop-preview-panel]");
  const templateButtons = composer?.querySelectorAll("[data-sop-template]");
  const insertButtons = composer?.querySelectorAll("[data-sop-insert]");

  if (composer && composerEditor instanceof HTMLTextAreaElement && composerPreview) {
    const composerForm = composer.closest("form");
    const titleInput =
      composerForm?.querySelector('input[name="title"]') instanceof HTMLInputElement
        ? composerForm.querySelector('input[name="title"]')
        : null;
    const subtitleInput =
      composerForm?.querySelector('input[name="subtitle"]') instanceof HTMLInputElement
        ? composerForm.querySelector('input[name="subtitle"]')
        : null;

    const setActiveTemplateButton = (activeKey) => {
      templateButtons?.forEach((button) => {
        const isActive = button.getAttribute("data-sop-template") === activeKey;
        button.classList.toggle("is-active", isActive);
      });
    };

    const setActivePreviewTab = (activeKey) => {
      composerPreviewTabs?.forEach((button) => {
        const isActive = button.getAttribute("data-sop-preview-tab") === activeKey;
        button.classList.toggle("is-active", isActive);
      });

      composerPreviewPanels?.forEach((panel) => {
        const isActive = panel.getAttribute("data-sop-preview-panel") === activeKey;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });
    };

    const extractStructuredSections = (text) => {
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const sections = [];
      let currentSection = null;

      lines.forEach((line) => {
        const isHeading = /^[A-Z][A-Z\s/&(),-]{3,}:?$/.test(line);

        if (isHeading) {
          if (currentSection) {
            sections.push(currentSection);
          }

          currentSection = {
            title: line.replace(/:$/, ""),
            items: []
          };
          return;
        }

        if (!currentSection) {
          currentSection = { title: "Overview", items: [] };
        }

        currentSection.items.push(line);
      });

      if (currentSection) {
        sections.push(currentSection);
      }

      return sections;
    };

    const updateComposerPreview = () => {
      const text = composerEditor.value.trim();
      const previewPanel = composerPreview.querySelector('[data-sop-preview-panel="preview"]');
      const structurePanel = composerPreview.querySelector('[data-sop-preview-panel="structure"]');
      const printPanel = composerPreview.querySelector('[data-sop-preview-panel="print"]');

      if (!previewPanel || !structurePanel || !printPanel) {
        return;
      }

      if (!text) {
        previewPanel.innerHTML = `<div class="sop-preview-empty">Start writing to see the SOP preview here.</div>`;
        structurePanel.innerHTML = `<div class="sop-preview-empty">Section headings and procedural structure will appear here.</div>`;
        printPanel.innerHTML = `<div class="sop-preview-empty">A print-ready SOP view will appear here.</div>`;
        return;
      }

      const title = titleInput?.value.trim() || "Untitled SOP";
      const subtitle = subtitleInput?.value.trim();
      const sections = extractStructuredSections(composerEditor.value);

      previewPanel.innerHTML = `
        <div class="sop-preview-document">
          <div class="sop-preview-prose">${renderPreviewHtml(composerEditor.value)}</div>
        </div>
      `;

      structurePanel.innerHTML = sections.length
        ? `
          <div class="sop-structure-preview">
            ${sections
              .map(
                (section, index) => `
                  <article class="sop-structure-preview-card">
                    <span class="pill">Section ${index + 1}</span>
                    <h4>${section.title}</h4>
                    <p>${section.items.length} content line${section.items.length === 1 ? "" : "s"}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        `
        : `<div class="sop-preview-empty">Use uppercase section headings to build a stronger SOP structure map.</div>`;

      printPanel.innerHTML = `
        <div class="sop-print-sheet">
          <div class="sop-print-sheet-header">
            <p class="eyebrow">Print-ready draft</p>
            <h2>${title}</h2>
            ${subtitle ? `<p class="section-copy">${subtitle}</p>` : ""}
          </div>
          <div class="sop-print-sheet-body">${renderPreviewHtml(composerEditor.value)}</div>
        </div>
      `;
    };

    const insertAtCursor = (snippet) => {
      const start = composerEditor.selectionStart;
      const end = composerEditor.selectionEnd;
      const current = composerEditor.value;
      composerEditor.value = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
      const nextPosition = start + snippet.length;
      composerEditor.focus();
      composerEditor.setSelectionRange(nextPosition, nextPosition);
      updateComposerPreview();
    };

    templateButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        const templateKey = button.getAttribute("data-sop-template");
        if (!templateKey || !sopTemplates[templateKey]) {
          return;
        }

        if (composerEditor.value.trim() && !window.confirm("Replace the current draft in the composer with this template?")) {
          return;
        }

        composerEditor.value = sopTemplates[templateKey];
        setActiveTemplateButton(templateKey);
        composerEditor.focus();
        composerEditor.setSelectionRange(composerEditor.value.length, composerEditor.value.length);
        updateComposerPreview();
      });
    });

    insertButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        const snippetKey = button.getAttribute("data-sop-insert");
        if (!snippetKey || !sopSnippets[snippetKey]) {
          return;
        }

        insertAtCursor(sopSnippets[snippetKey]);
      });
    });

    composerEditor.addEventListener("input", updateComposerPreview);
    composerEditor.addEventListener("input", () => {
      if (!composerEditor.value.trim()) {
        setActiveTemplateButton("");
      }
    });
    titleInput?.addEventListener("input", updateComposerPreview);
    subtitleInput?.addEventListener("input", updateComposerPreview);
    composerPreviewTabs?.forEach((button) => {
      button.addEventListener("click", () => {
        const tabKey = button.getAttribute("data-sop-preview-tab") || "preview";
        setActivePreviewTab(tabKey);
      });
    });
    setActivePreviewTab("preview");
    updateComposerPreview();
  }
});
