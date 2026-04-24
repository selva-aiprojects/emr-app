import { EMR_WORKFLOWS } from '../../pages/EmrOnlyPage.jsx';

export const navigateToWorkflow = (workflow) => {
  const event = new CustomEvent('emrWorkflowChange', { detail: workflow });
  window.dispatchEvent(event);
};

export const resetToDashboard = () => {
  navigateToWorkflow(EMR_WORKFLOWS.DASHBOARD);
};

export const navigateToNewEncounter = () => {
  navigateToWorkflow(EMR_WORKFLOWS.NEW_ENCOUNTER);
};

export const navigateToEncounterList = () => {
  navigateToWorkflow(EMR_WORKFLOWS.ENCOUNTER_LIST);
};

export const navigateToPatientDetail = () => {
  navigateToWorkflow(EMR_WORKFLOWS.PATIENT_DETAIL);
};

export const navigateToEncounterDetail = () => {
  navigateToWorkflow(EMR_WORKFLOWS.ENCOUNTER_DETAIL);
};
