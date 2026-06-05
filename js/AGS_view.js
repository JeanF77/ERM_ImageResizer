/*******************************************************************************/
/*                    (C) Copyright 2019 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/
/*
+-------------------------------------------------------------------------------+
| Revision |    Date    |     Author     |                Issue                 |
+-------------------------------------------------------------------------------+
|     1    | JJ/MM/AAAA |   Safran       | Initial version                      |
|                                                                               |
| https://jazz.net/wiki/bin/view/Main/RMExtensions6061                          |
+-------------------------------------------------------------------------------+
*/

/* ------------------------------------------------------------------------------
	---- Constantes
   --------------------------------------------------------------------------- */

// ---- Pour GUI :
// ----     - ROOT + TARGET
// ----     - ROOT = racine de l'objet graphique
// ----     - TARGET = "Btn", "BtnContent" ...
// ----     - ROOT + STATUS
// ----     - ROOT = racine de l'objet graphique
// ----     - STATUS = "Loading", "Failed", "Success" ...

// ---- Status

const GUI_STATUS_LOADING                     = "Loading";
const GUI_STATUS_SUCESS                      = "Success";
const GUI_STATUS_FAILED                      = "Failed";
const GUI_STATUS_WARNING                     = "Warning";
const GUI_STATUS_ERROR                       = "Error";

// ---- GUI Objects and Objects Root

const GUI_ITEM_UPDATE_BTN_ROOT               = "gui_update";

const GUI_ITEM_UPDATE_ROOT                   = "gui_UpdateIndicator";
const GUI_ITEM_MODULE_NAME                   = "gui_modulename";
const GUI_ITEM_NBARTANALYSE                  = "gui_nbrartanalyze";
const GUI_ITEM_NBARTMODIFIED                 = "gui_nbrartmodified";
const GUI_ITEM_MSGERROR                      = "gui_errormsg";
const GUI_ITEM_FIRSTARTIFACTSEL              = "gui_firstartifact";
const GUI_ITEM_LASTARTIFACTSEL               = "gui_lastartifact";

// ---- Icons

const GUI_ICON_SUCCESS                       = "./resources/icon_success.png";
const GUI_ICON_FAILED                        = "./resources/icon_failed.png";
const GUI_ICON_WARNING                       = "./resources/icon_warning.png";
const GUI_ICON_LOADING                       = "./resources/loading.gif";

/* --------------------------------------------------------------------------- */

const UPD_CHECK                              = "mode_check";
const UPD_MODIFY                             = "mode_modify";

const ELM_ATTR_TYPE                          = "Artifact Type";

const MAX_ARTIFACT                           = 200;

const LOG_OPER_STRCOPY                       = "log_str_copy";
const LOG_OPER_INT2STR                       = "log_int_to_str";
const LOG_OPER_ENUMCOPYREPL                  = "log_enum_copyrepl";
const LOG_OPER_ENUMREPL                      = "log_enum_repl";

const GUI_ITEM_IMAGE_WIDTH                   = "gui_imagewidth";

const MIN_IMAGE_SIZE                         = 20;
const MAX_IMAGE_SIZE                         = 1000;

/* ------------------------------------------------------------------------------
	---- Classes
   --------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------
   ---- Variables globales
   --------------------------------------------------------------------------- */

var g_ModuleRef;                                // ---- Module Reference Object

var g_Artifact = {
   'moduleId'     : null,                       // ---- Module ID
   'moduleName'   : null,                       // ---- Module Name
   'custattrlist' : [],                         // ---- List of custom attributes to modify
   'artList'      : []                          // ---- List of selected artifacts
}

var g_LogReport = {                             // ---- Structure to store widget excecution report
   'nbScannedArtifacts' : 0,
   'nbUpdatedArtifacts' : 0,
   'firstArtifactSel'   : "",
   'lastArtifactSel'    : "",
   'modifLog'           : []
}

/* ------------------------------------------------------------------------------
	---- Core Fonctions
   --------------------------------------------------------------------------- */

/**
 * Callback on "Open Artifact" event
 * @param {Object} artifactRef - Reference to artifact
 */

function rm_artifactOpen (artifactRef) {
   let myAttrList = [];

   mgt_Console (rm_artifactOpen.name + ' : Open artifact', CONSOLE_INFO);

   // ---- Turn Off GUI buttons

   gui_mgtButtonDrop (GUI_ITEM_UPDATE_BTN_ROOT, ACTION_ACTIVE_OFF);

   gui_MgtProgressIndicator (GUI_ITEM_UPDATE_ROOT, ACTION_DISP_OFF);

   // ---- Stack the attributes to fetch

   myAttrList.push (RM.Data.Attributes.IDENTIFIER);
   myAttrList.push (RM.Data.Attributes.NAME);
   myAttrList.push (RM.Data.Attributes.FORMAT);

   // ---- Get artifact attributes

   RM.Data.getAttributes (artifactRef, myAttrList, function (result) {
      let myArtifactID;
      let myArtifactName;

      if (result.code === RM.OperationResult.OPERATION_OK) {
         mgt_Console (rm_artifactOpen.name + " : Get module details", CONSOLE_INFO);

         myArtifactID = result.data[0].values[RM.Data.Attributes.IDENTIFIER];
         myArtifactName = result.data[0].values[RM.Data.Attributes.NAME];

         if (result.data[0].values[RM.Data.Attributes.FORMAT] === "Module") {
            // ---- Open artifact is a module

            mgt_Console (rm_artifactOpen.name + ' : Artifact is a module', CONSOLE_INFO);

            $("#" + GUI_ITEM_MSGERROR).hide();
            $("#" + GUI_ITEM_MODULE_NAME).text(myArtifactID + ":" + myArtifactName);

            g_Artifact.moduleId   = myArtifactID;
            g_Artifact.moduleName = myArtifactName;
         } else {
            // ---- Open artifact is not a module

            mgt_Console (rm_artifactOpen.name + ' : Artifact is not a module !', CONSOLE_WARNING);

            $("#" + GUI_ITEM_MODULE_NAME).text("*** Not a Module ! ***");

            g_Artifact.moduleId   = null;
            g_Artifact.moduleName = null;
         }
      } else {
         mgt_Console (rm_artifactOpen.name + " : Can not get module details !", CONSOLE_ERROR);

         $("#" + GUI_ITEM_MODULE_NAME).text("*** Get Module Error ***");
      }
   });
}

/**
 * Callback on "Close Artifact" event
 */

function rm_artifactClose () {

   mgt_Console (rm_artifactClose.name + ' : Close artifact', CONSOLE_INFO);

   g_Artifact.moduleId = null;

   $("#" + GUI_ITEM_MODULE_NAME).text("*** Select a Module ! ***");

   // ---- Turn Off GUI buttons

   gui_mgtButtonDrop (GUI_ITEM_UPDATE_BTN_ROOT, ACTION_ACTIVE_OFF);

   gui_MgtProgressIndicator (GUI_ITEM_UPDATE_ROOT, ACTION_DISP_OFF);

   // ---- Empty all
   
   $("#" + GUI_ITEM_NBARTANALYSE).empty();
   $("#" + GUI_ITEM_NBARTMODIFIED).empty();
   $("#" + GUI_ITEM_FIRSTARTIFACTSEL).empty();
   $("#" + GUI_ITEM_LASTARTIFACTSEL).empty();

   $("#" + GUI_ITEM_MSGERROR).hide();
}

/**
 * Callback on "Select Artifact" event
 */

function rm_artifactSelect (artifactRef) {
   mgt_Console (rm_artifactSelect.name + ' : Select artifact ' + artifactRef.length + ' artifacts', CONSOLE_INFO);

   g_Artifact.artList.splice (0);

   $("#" + GUI_ITEM_MSGERROR).hide();

   gui_mgtButtonDrop (GUI_ITEM_UPDATE_BTN_ROOT, ACTION_ACTIVE_OFF);

   // ---- Test number of selected artifacts

   if (g_Artifact.moduleId === null) {
      // ---- No module open

      $("#" + GUI_ITEM_MSGERROR).text("No module open !");
      $("#" + GUI_ITEM_MSGERROR).show();
   } else if (artifactRef.length > MAX_ARTIFACT) {
      // ---- Do not select more than "MAX_ARTIFACT"

      $("#" + GUI_ITEM_MSGERROR).text("Max artifacts is " + MAX_ARTIFACT + " !");
      $("#" + GUI_ITEM_MSGERROR).show();
   } else if (artifactRef.length > 0)  {
      // ---- Number of selected artifacts is good !

      g_Artifact.artList = artifactRef;

      gui_mgtButtonDrop (GUI_ITEM_UPDATE_BTN_ROOT, ACTION_ACTIVE_ON);
   }
}

/**
 * Update Data Model - Resize embedded images in artifacts Primary Text
 * @param {Array} artifactList - Selected artifacts list
 * @param {Number} imageWidth - Target image width in pixels
 */

function resize_primaryText (artifactList, imageWidth) {
   let myAttrList = [];

   // ---- Empty log

   g_LogReport.modifLog.splice (0);
   g_LogReport.nbScannedArtifacts = 0;
   g_LogReport.nbUpdatedArtifacts = 0;
   g_LogReport.firstArtifactSel   = null;
   g_LogReport.lastArtifactSel    = null;

   $("#" + GUI_ITEM_NBARTANALYSE).text(g_LogReport.nbScannedArtifacts);
   $("#" + GUI_ITEM_NBARTMODIFIED).text(g_LogReport.nbUpdatedArtifacts);

   gui_MgtProgressIndicator (GUI_ITEM_UPDATE_ROOT, IS_INPROGRESS);

   mgt_Console (resize_primaryText.name + ' : Ready to scan ' + artifactList.length + ' artifacts', CONSOLE_INFO);

   // ---- Stack all attributes to fetch

   g_Artifact.custattrlist.splice (0);

   myAttrList.push (RM.Data.Attributes.IDENTIFIER);
   myAttrList.push (RM.Data.Attributes.FORMAT);
   myAttrList.push (RM.Data.Attributes.PRIMARY_TEXT);

   // ---- Get Artifact Attributes

   RM.Data.getAttributes (artifactList, myAttrList, function (result) {
      let myArtifact;
      let toSave = [];

      if (result.code === RM.OperationResult.OPERATION_OK) {
         // ---- Loop on attributes

         result.data.forEach (function (artifactRef) {
            // ---- Store first and last selected artifact (select stack is inverted !)

            if (g_LogReport.lastArtifactSel === null) {
               g_LogReport.lastArtifactSel = artifactRef.values[RM.Data.Attributes.IDENTIFIER];
            }

            g_LogReport.firstArtifactSel = artifactRef.values[RM.Data.Attributes.IDENTIFIER];

            g_LogReport.nbScannedArtifacts++;

            $("#" + GUI_ITEM_NBARTANALYSE).text(g_LogReport.nbScannedArtifacts);

            myArtifact = content_resizeImage (artifactRef, imageWidth);

            if (myArtifact !== null) {
               toSave.push (myArtifact);

               mgt_Console (resize_primaryText.name + " : Resize image in artifact '" + artifactRef.values[RM.Data.Attributes.IDENTIFIER] + "'", CONSOLE_INFO);
            }
         });

         $("#" + GUI_ITEM_FIRSTARTIFACTSEL).text(g_LogReport.firstArtifactSel);
         $("#" + GUI_ITEM_LASTARTIFACTSEL).text(g_LogReport.lastArtifactSel);

         // ---- Save modified artifacts

         if (toSave.length > 0) {
            mgt_Console (resize_primaryText.name + " : Ready to save modified artifacts ...", CONSOLE_INFO);

            set_Attributes (toSave);
         } else { // ---- Nothing to update !

            $("#" + GUI_ITEM_NBARTANALYSE).text(g_LogReport.nbScannedArtifacts);
            $("#" + GUI_ITEM_NBARTMODIFIED).text(g_LogReport.nbUpdatedArtifacts);

            gui_MgtProgressIndicator (GUI_ITEM_UPDATE_ROOT, IS_SUCCESS);
            mgt_Console (resize_primaryText.name + ': Nothing to modify', CONSOLE_INFO);
         }
      } else {
         gui_MgtProgressIndicator (GUI_ITEM_UPDATE_ROOT, IS_ERROR);
         mgt_Console (resize_primaryText.name + ': Failed to get artifact attributes !', CONSOLE_ERROR);
      }
   });
}

/**
 * Set attributes in "batch" mode
 * @param {Array} artifactList - Array of RM ArtifactRef objects
 * @param {BigInteger} updateIndex - Update Index [Optional]
 */

function set_Attributes (artifactList, updateIndex) {
   const MAX_ARTIFACT_UPDATE = 3;

   let myArtifactUpdList = [...artifactList];
   let myArtifactUpdListCopy;
   let myUpdIndex = (updateIndex === undefined ? 0 : updateIndex);

   // ---- Disable buttons

   gui_mgtButtonDrop (GUI_ITEM_UPDATE_BTN_ROOT, ACTION_ACTIVE_OFF);
   
   // ---- Start batch update

   if (myArtifactUpdList.length > myUpdIndex) {
      mgt_Console(set_Attributes.name + ' : update block size (' + MAX_ARTIFACT_UPDATE + ') at index = ' + myUpdIndex, CONSOLE_INFO);

      myArtifactUpdListCopy = myArtifactUpdList.slice(myUpdIndex, myUpdIndex + MAX_ARTIFACT_UPDATE);

      myUpdIndex += MAX_ARTIFACT_UPDATE;

      RM.Data.setAttributes (myArtifactUpdListCopy, function (result) { // ---- Call RM API to update attributes
         $("#" + GUI_ITEM_NBARTANALYSE).text(g_LogReport.nbScannedArtifacts);

         // ---- Set update status for each modified artifact

         result.data.forEach (function (myArtifact) {
            if (myArtifact.code === RM.OperationResult.OPERATION_OK) {
               g_LogReport.nbUpdatedArtifacts++;

               $("#" + GUI_ITEM_NBARTMODIFIED).text(g_LogReport.nbUpdatedArtifacts);
            }
         });

         // ---- Manage batch update action and status

         if (result.code === RM.OperationResult.OPERATION_OK) { // ---- All artifacts in batch are correctly saved
            mgt_Console (set_Attributes.name + " : Successful update for block at index " + myUpdIndex, CONSOLE_INFO);

            // ---- Compute the next block with a direct recursive call

            set_Attributes (artifactList, myUpdIndex);
         } else { // ---- Not all artifacts are correctly saved
            mgt_Console (set_Attributes.name + " : Failed update for block at index " + myUpdIndex, CONSOLE_ERROR);

            gui_MgtProgressIndicator (GUI_ITEM_UPDATE_ROOT, IS_ERROR);

            $("#" + GUI_ITEM_MSGERROR).text("Failed to set attribute values !").show();

            gui_mgtButtonDrop (GUI_ITEM_UPDATE_BTN_ROOT, ACTION_ACTIVE_ON);
         }
      });
   } else { // ---- End of batch update
      mgt_Console(set_Attributes.name + ' : batch update is finished !', CONSOLE_INFO);

      gui_MgtProgressIndicator (GUI_ITEM_UPDATE_ROOT, IS_SUCCESS);

      // ---- Enable buttons

      gui_mgtButtonDrop (GUI_ITEM_UPDATE_BTN_ROOT, ACTION_ACTIVE_ON);
   }
}

/**
 * Resize embedded images in artifact Primary Text
 * @param {Object} artifactRef - Artifact (reference + attributes)
 * @param {Number} imageWidth - Target image width in pixels
 * @return - Modified artifact, else "null"
 */

function content_resizeImage (artifactRef, imageWidth) {
   let myNewPrimaryText;
   let myPrimaryText = artifactRef.values[RM.Data.Attributes.PRIMARY_TEXT];

   // ---- Skip non-Text format artifacts

   if (artifactRef.values[RM.Data.Attributes.FORMAT] !== RM.Data.Formats.TEXT) {
      return null;
   }

   myNewPrimaryText = resizeEmbeddedImages (myPrimaryText, imageWidth);

   // ---- Return resized artifact

   if (myNewPrimaryText !== null && myNewPrimaryText !== myPrimaryText) {
      artifactRef.values[RM.Data.Attributes.PRIMARY_TEXT] = myNewPrimaryText;

      return artifactRef;
   } else { // ---- No embedded image found, nothing to update !
      return null;
   }
}

/**
 * Resize embedded images in an HTML string
 * - Form 1 (no size): adds width attribute
 * - Form 2 (with size): replaces width and removes height to preserve proportionality
 * @param {String} htmlString - HTML string to process
 * @param {Number} imageWidth - Target image width in pixels
 * @returns - Updated HTML string, else "null"
 */

function resizeEmbeddedImages(htmlString, imageWidth) {
  if (!htmlString || typeof htmlString !== 'string') {
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const body = doc.body;

  // ---- On récupère toutes les images ayant un alt, puis on filtre en JS
  const embeddedImages = Array.from(body.querySelectorAll('img[alt]'))
    .filter(img => typeof img.alt === 'string' && img.alt.toLowerCase() === 'embedded image');

  if (embeddedImages.length === 0) {
    return null;
  }

  embeddedImages.forEach(img => {
    img.setAttribute('width', imageWidth);
    img.removeAttribute('height');
  });

  return body.innerHTML;
}

/* --------------------------------------------------------------------------- */

/**
 * Callback on "Update" button event
 */

function btnupdate_artifact () {
   let myImageWidth = parseInt($("#" + GUI_ITEM_IMAGE_WIDTH).val(), 10);

   mgt_Console (btnupdate_artifact.name + ' : Update Data Model - Resize Image Mode', CONSOLE_INFO);

   $("#" + GUI_ITEM_MSGERROR).hide();

   // ---- Validate and correct image width

   if (isNaN(myImageWidth) || myImageWidth < MIN_IMAGE_SIZE) {
      myImageWidth = MIN_IMAGE_SIZE;
      $("#" + GUI_ITEM_IMAGE_WIDTH).val(myImageWidth);
      $("#" + GUI_ITEM_MSGERROR).text("Width corrected to minimum value (" + MIN_IMAGE_SIZE + " px)");
      $("#" + GUI_ITEM_MSGERROR).show();
   } else if (myImageWidth > MAX_IMAGE_SIZE) {
      myImageWidth = MAX_IMAGE_SIZE;
      $("#" + GUI_ITEM_IMAGE_WIDTH).val(myImageWidth);
      $("#" + GUI_ITEM_MSGERROR).text("Width corrected to maximum value (" + MAX_IMAGE_SIZE + " px)");
      $("#" + GUI_ITEM_MSGERROR).show();
   }

   resize_primaryText (g_Artifact.artList, myImageWidth);
}

/**
 * Attach button handler
 */

function gui_eventHandler() {
    $('#' + GUI_ITEM_UPDATE_BTN_ROOT + GUI_TARGET_BTN).on('click', btnupdate_artifact);
}

/* --------------------------------------------------------------------------- */

/** Initialisation de l'IHM du widget */

function view_init () {

   // ---- GUI Init

   gui_eventHandler();

   gui_mgtButtonDrop (GUI_ITEM_UPDATE_BTN_ROOT, ACTION_ACTIVE_OFF);

   $("#" + GUI_ITEM_MODULE_NAME).text("*** Select a Module ! ***");

   // ---- RM : subscribe to event client 

   RM.Event.subscribe (RM.Event.ARTIFACT_OPENED, rm_artifactOpen);
   RM.Event.subscribe (RM.Event.ARTIFACT_CLOSED, rm_artifactClose);
   RM.Event.subscribe (RM.Event.ARTIFACT_SELECTED, rm_artifactSelect);
}

