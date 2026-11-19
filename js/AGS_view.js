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

const GUI_STATUS_LOADING = "Loading";
const GUI_STATUS_SUCESS = "Success";
const GUI_STATUS_FAILED = "Failed";
const GUI_STATUS_WARNING = "Warning";
const GUI_STATUS_ERROR = "Error";

// ---- GUI Objects and Objects Root

const GUI_ITEM_UPDATE_BTN_ROOT = "gui_update";
const GUI_ITEM_RESET_BTN_ROOT = "gui_reset";

const GUI_ITEM_UPDATE_ROOT = "gui_UpdateIndicator";
const GUI_ITEM_MODULE_NAME = "gui_modulename";
const GUI_ITEM_NBARTANALYSE = "gui_nbrartanalyze";
const GUI_ITEM_NBARTMODIFIED = "gui_nbrartmodified";
const GUI_ITEM_MSGERROR = "gui_errormsg";
const GUI_ITEM_FIRSTARTIFACTSEL = "gui_firstartifact";
const GUI_ITEM_LASTARTIFACTSEL = "gui_lastartifact";

// ---- Icons

const GUI_ICON_SUCCESS = "./resources/icon_success.png";
const GUI_ICON_FAILED = "./resources/icon_failed.png";
const GUI_ICON_WARNING = "./resources/icon_warning.png";
const GUI_ICON_LOADING = "./resources/loading.gif";

/* --------------------------------------------------------------------------- */

const UPD_CHECK = "mode_check";
const UPD_MODIFY = "mode_modify";

const ELM_ATTR_TYPE = "Artifact Type";

const MAX_ARTIFACT = 200;

const LOG_OPER_STRCOPY = "log_str_copy";
const LOG_OPER_INT2STR = "log_int_to_str";
const LOG_OPER_ENUMCOPYREPL = "log_enum_copyrepl";
const LOG_OPER_ENUMREPL = "log_enum_repl";

const GUI_ITEM_IMAGE_WIDTH = "gui_imagewidth";

const MIN_IMAGE_SIZE = 20;
const MAX_IMAGE_SIZE = 1000;

// ---- Embedded image detection

const EMBEDDED_IMAGE_ALT = "embedded image";    // ---- Value of "alt" attribute (case-insensitive)
const WRAPPED_RESOURCE_PATH = "/wrappedResources/";   // ---- Path of an image stored in ERM ("src" attribute)

// ---- Configuration context

const CONFIG_UNKNOWN = "config_unknown";        // ---- Not read yet
const CONFIG_EDITABLE = "config_editable";      // ---- Change set or stream : artifacts can be modified
const CONFIG_BASELINE = "config_baseline";      // ---- Baseline : artifacts can not be modified
const CONFIG_ERROR = "config_error";            // ---- Not readable, or not supported

const OSLC_CONFIG_CONTEXT_PARAM = "oslc_config.context";

/* ------------------------------------------------------------------------------
   ---- Classes
   --------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------
   ---- Variables globales
   --------------------------------------------------------------------------- */

var g_ModuleRef;                                // ---- Module Reference Object

var g_Artifact = {
   'moduleId': null,                       // ---- Module ID
   'moduleName': null,                       // ---- Module Name
   'custattrlist': [],                         // ---- List of custom attributes to modify
   'artList': []                          // ---- List of selected artifacts
}

var g_ConfigContext = {                         // ---- Configuration context of the open module
   'status': CONFIG_UNKNOWN,                    // ---- CONFIG_UNKNOWN, CONFIG_EDITABLE, CONFIG_BASELINE, CONFIG_ERROR
   'contextUri': null,                          // ---- Value of "oslc_config.context" (change set, else stream), "null" if none
   'errorMsg': null                             // ---- Message displayed when artifacts can not be modified
}

var g_LogReport = {                             // ---- Structure to store widget excecution report
   'nbScannedArtifacts': 0,
   'nbUpdatedArtifacts': 0,
   'firstArtifactSel': "",
   'lastArtifactSel': "",
   'modifLog': []
}

/* ------------------------------------------------------------------------------
   ---- Core Fonctions
   --------------------------------------------------------------------------- */

/**
 * Callback on "Open Artifact" event
 * @param {Object} artifactRef - Reference to artifact
 */

function rm_artifactOpen(artifactRef) {
   let myAttrList = [];

   mgt_Console(rm_artifactOpen.name + ' : Open artifact', CONSOLE_INFO);

   // ---- Turn Off GUI buttons

   gui_mgtActionButtons(ACTION_ACTIVE_OFF);

   gui_MgtProgressIndicator(GUI_ITEM_UPDATE_ROOT, ACTION_DISP_OFF);

   // ---- Previous selection and configuration context are no longer valid

   g_Artifact.artList = [];

   config_setContext(CONFIG_UNKNOWN, null, null);

   // ---- Stack the attributes to fetch

   myAttrList.push(RM.Data.Attributes.IDENTIFIER);
   myAttrList.push(RM.Data.Attributes.NAME);
   myAttrList.push(RM.Data.Attributes.FORMAT);

   // ---- Get artifact attributes

   RM.Data.getAttributes(artifactRef, myAttrList, function (result) {
      let myArtifactID;
      let myArtifactName;

      if (result.code === RM.OperationResult.OPERATION_OK) {
         mgt_Console(rm_artifactOpen.name + " : Get module details", CONSOLE_INFO);

         myArtifactID = result.data[0].values[RM.Data.Attributes.IDENTIFIER];
         myArtifactName = result.data[0].values[RM.Data.Attributes.NAME];

         if (result.data[0].values[RM.Data.Attributes.FORMAT] === "Module") {
            // ---- Open artifact is a module

            mgt_Console(rm_artifactOpen.name + ' : Artifact is a module', CONSOLE_INFO);

            $("#" + GUI_ITEM_MSGERROR).hide();
            $("#" + GUI_ITEM_MODULE_NAME).text(myArtifactID + ":" + myArtifactName);

            g_Artifact.moduleId = myArtifactID;
            g_Artifact.moduleName = myArtifactName;

            // ---- Get the configuration context (change set, stream or baseline)

            config_getCurrentContext();
         } else {
            // ---- Open artifact is not a module

            mgt_Console(rm_artifactOpen.name + ' : Artifact is not a module !', CONSOLE_WARNING);

            $("#" + GUI_ITEM_MODULE_NAME).text("*** Not a Module ! ***");

            g_Artifact.moduleId = null;
            g_Artifact.moduleName = null;
         }
      } else {
         mgt_Console(rm_artifactOpen.name + " : Can not get module details !", CONSOLE_ERROR);

         $("#" + GUI_ITEM_MODULE_NAME).text("*** Get Module Error ***");
      }
   });
}

/**
 * Callback on "Close Artifact" event
 */

function rm_artifactClose() {

   mgt_Console(rm_artifactClose.name + ' : Close artifact', CONSOLE_INFO);

   g_Artifact.moduleId = null;
   g_Artifact.artList = [];

   $("#" + GUI_ITEM_MODULE_NAME).text("*** Select a Module ! ***");

   // ---- Turn Off GUI buttons

   gui_mgtActionButtons(ACTION_ACTIVE_OFF);

   config_setContext(CONFIG_UNKNOWN, null, null);

   gui_MgtProgressIndicator(GUI_ITEM_UPDATE_ROOT, ACTION_DISP_OFF);

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

function rm_artifactSelect(artifactRef) {
   mgt_Console(rm_artifactSelect.name + ' : Select artifact ' + artifactRef.length + ' artifacts', CONSOLE_INFO);

   g_Artifact.artList.splice(0);

   $("#" + GUI_ITEM_MSGERROR).hide();

   gui_mgtActionButtons(ACTION_ACTIVE_OFF);

   // ---- Test number of selected artifacts

   if (g_Artifact.moduleId === null) {
      // ---- No module open

      $("#" + GUI_ITEM_MSGERROR).text("No module open !");
      $("#" + GUI_ITEM_MSGERROR).show();
   } else if (g_ConfigContext.errorMsg !== null) {
      // ---- Baseline or configuration error : artifacts can not be modified

      $("#" + GUI_ITEM_MSGERROR).text(g_ConfigContext.errorMsg);
      $("#" + GUI_ITEM_MSGERROR).show();
   } else if (artifactRef.length > MAX_ARTIFACT) {
      // ---- Do not select more than "MAX_ARTIFACT"

      $("#" + GUI_ITEM_MSGERROR).text("Max artifacts is " + MAX_ARTIFACT + " !");
      $("#" + GUI_ITEM_MSGERROR).show();
   } else if (artifactRef.length > 0) {
      // ---- Number of selected artifacts is good !

      g_Artifact.artList = artifactRef;

      // ---- If the configuration context is not read yet, buttons are enabled when it is (see config_setContext)

      if (g_ConfigContext.status === CONFIG_EDITABLE) {
         gui_mgtActionButtons(ACTION_ACTIVE_ON);
      }
   }
}

/**
 * Get the current configuration context of ERM
 * - The change set (if any) is used first, else the stream
 * - Baseline : artifacts can not be modified, action buttons stay disabled
 * - No configuration (project without configuration management) : no context is added to requests
 */

function config_getCurrentContext() {
   RM.Client.getCurrentConfigurationContext(function (result) {
      if (result.code === RM.OperationResult.OPERATION_OK) {
         const COMPONENT_CONTEXT = result.data;
         const LOCAL_CONFIG_URI = COMPONENT_CONTEXT.localConfigurationUri;

         if (COMPONENT_CONTEXT.changeSetUri) { // ---- Change set first
            config_setContext(CONFIG_EDITABLE, COMPONENT_CONTEXT.changeSetUri, null);
         } else if (!LOCAL_CONFIG_URI) { // ---- No configuration management
            config_setContext(CONFIG_EDITABLE, null, null);
         } else if (LOCAL_CONFIG_URI.indexOf("/baseline/") > -1) { // ---- Baseline can not be modified !
            config_setContext(CONFIG_BASELINE, null, "Baseline can not be modified !");
         } else if (LOCAL_CONFIG_URI.indexOf("/stream/") > -1) { // ---- Stream
            config_setContext(CONFIG_EDITABLE, LOCAL_CONFIG_URI, null);
         } else { // ---- Other configuration type
            config_setContext(CONFIG_ERROR, null, "Configuration is not a stream or a change set !");
         }
      } else { // ---- Other error
         config_setContext(CONFIG_ERROR, null, "Can not get configuration context !");
      }
   });
}

/**
 * Store the configuration context, and update action buttons and error message
 * @param {String} status - Context status (CONFIG_UNKNOWN, CONFIG_EDITABLE, CONFIG_BASELINE, CONFIG_ERROR)
 * @param {String} contextUri - Value of "oslc_config.context" (change set or stream URI), "null" if none
 * @param {String} errorMsg - Message displayed when artifacts can not be modified, else "null"
 */

function config_setContext(status, contextUri, errorMsg) {
   g_ConfigContext.status = status;
   g_ConfigContext.contextUri = contextUri;
   g_ConfigContext.errorMsg = errorMsg;

   if (status === CONFIG_UNKNOWN) {
      return;
   }

   mgt_Console(config_setContext.name + " : Configuration context = " + status + " (" + contextUri + ")", (errorMsg === null ? CONSOLE_INFO : CONSOLE_WARNING));

   if (errorMsg !== null) { // ---- Artifacts can not be modified
      gui_mgtActionButtons(ACTION_ACTIVE_OFF);

      $("#" + GUI_ITEM_MSGERROR).text(errorMsg);
      $("#" + GUI_ITEM_MSGERROR).show();
   } else if (g_Artifact.artList.length > 0) { // ---- Artifacts selected before the context was read
      gui_mgtActionButtons(ACTION_ACTIVE_ON);
   }
}

/**
 * Add the configuration context to a resource URL
 * - "oslc_config.context" is mandatory to read a resource of a change set or a stream (else HTTP 410)
 * @param {String} resourceUrl - Resource URL
 * @param {String} contextUri - Configuration URI (change set or stream), "null" for none
 * @returns - Resource URL completed with the configuration context
 */

function config_addContext(resourceUrl, contextUri) {
   if (contextUri === null) {
      return resourceUrl;
   }

   return resourceUrl + (resourceUrl.indexOf("?") > -1 ? "&" : "?") + OSLC_CONFIG_CONTEXT_PARAM + "=" + encodeURIComponent(contextUri);
}

/**
 * Update Data Model - Resize (or reset) embedded images in artifacts Primary Text
 * @param {Array} artifactList - Selected artifacts list
 * @param {Number} imageWidth - Target image width in pixels, "null" to reset images to their original size
 */

function resize_primaryText(artifactList, imageWidth) {
   let myAttrList = [];
   let myActionLabel = (imageWidth === null ? "Reset" : "Resize");

   // ---- Disable buttons while processing (image downloads may take time)

   gui_mgtActionButtons(ACTION_ACTIVE_OFF);

   // ---- Empty log

   g_LogReport.modifLog.splice(0);
   g_LogReport.nbScannedArtifacts = 0;
   g_LogReport.nbUpdatedArtifacts = 0;
   g_LogReport.firstArtifactSel = null;
   g_LogReport.lastArtifactSel = null;

   $("#" + GUI_ITEM_NBARTANALYSE).text(g_LogReport.nbScannedArtifacts);
   $("#" + GUI_ITEM_NBARTMODIFIED).text(g_LogReport.nbUpdatedArtifacts);

   gui_MgtProgressIndicator(GUI_ITEM_UPDATE_ROOT, IS_INPROGRESS);

   mgt_Console(resize_primaryText.name + ' : Ready to scan ' + artifactList.length + ' artifacts', CONSOLE_INFO);

   // ---- Stack all attributes to fetch

   g_Artifact.custattrlist.splice(0);

   myAttrList.push(RM.Data.Attributes.IDENTIFIER);
   myAttrList.push(RM.Data.Attributes.FORMAT);
   myAttrList.push(RM.Data.Attributes.PRIMARY_TEXT);

   // ---- Get Artifact Attributes

   RM.Data.getAttributes(artifactList, myAttrList, async function (result) {
      let myArtifact;
      let toSave = [];
      let mySizeCache = new Map();   // ---- Image natural size cache (key = image URL), shared by all artifacts

      if (result.code === RM.OperationResult.OPERATION_OK) {
         // ---- Loop on attributes (sequential : one image download at a time)

         for (const artifactRef of result.data) {
            // ---- Store first and last selected artifact (select stack is inverted !)

            if (g_LogReport.lastArtifactSel === null) {
               g_LogReport.lastArtifactSel = artifactRef.values[RM.Data.Attributes.IDENTIFIER];
            }

            g_LogReport.firstArtifactSel = artifactRef.values[RM.Data.Attributes.IDENTIFIER];

            g_LogReport.nbScannedArtifacts++;

            $("#" + GUI_ITEM_NBARTANALYSE).text(g_LogReport.nbScannedArtifacts);

            try {
               myArtifact = await content_resizeImage(artifactRef, imageWidth, mySizeCache);
            } catch (error) {
               myArtifact = null;

               mgt_Console(resize_primaryText.name + " : Failed to " + myActionLabel.toLowerCase() + " image in artifact '" + artifactRef.values[RM.Data.Attributes.IDENTIFIER] + "' : " + error, CONSOLE_ERROR);
            }

            if (myArtifact !== null) {
               toSave.push(myArtifact);

               mgt_Console(resize_primaryText.name + " : " + myActionLabel + " image in artifact '" + artifactRef.values[RM.Data.Attributes.IDENTIFIER] + "'", CONSOLE_INFO);
            }
         }

         $("#" + GUI_ITEM_FIRSTARTIFACTSEL).text(g_LogReport.firstArtifactSel);
         $("#" + GUI_ITEM_LASTARTIFACTSEL).text(g_LogReport.lastArtifactSel);

         // ---- Save modified artifacts

         if (toSave.length > 0) {
            mgt_Console(resize_primaryText.name + " : Ready to save modified artifacts ...", CONSOLE_INFO);

            set_Attributes(toSave);
         } else { // ---- Nothing to update !

            $("#" + GUI_ITEM_NBARTANALYSE).text(g_LogReport.nbScannedArtifacts);
            $("#" + GUI_ITEM_NBARTMODIFIED).text(g_LogReport.nbUpdatedArtifacts);

            gui_MgtProgressIndicator(GUI_ITEM_UPDATE_ROOT, IS_SUCCESS);
            mgt_Console(resize_primaryText.name + ': Nothing to modify', CONSOLE_INFO);

            gui_mgtActionButtons(ACTION_ACTIVE_ON);
         }
      } else {
         gui_MgtProgressIndicator(GUI_ITEM_UPDATE_ROOT, IS_ERROR);
         mgt_Console(resize_primaryText.name + ': Failed to get artifact attributes !', CONSOLE_ERROR);

         gui_mgtActionButtons(ACTION_ACTIVE_ON);
      }
   });
}

/**
 * Set attributes in "batch" mode
 * @param {Array} artifactList - Array of RM ArtifactRef objects
 * @param {BigInteger} updateIndex - Update Index [Optional]
 */

function set_Attributes(artifactList, updateIndex) {
   const MAX_ARTIFACT_UPDATE = 3;

   let myArtifactUpdList = [...artifactList];
   let myArtifactUpdListCopy;
   let myUpdIndex = (updateIndex === undefined ? 0 : updateIndex);

   // ---- Disable buttons

   gui_mgtActionButtons(ACTION_ACTIVE_OFF);

   // ---- Start batch update

   if (myArtifactUpdList.length > myUpdIndex) {
      mgt_Console(set_Attributes.name + ' : update block size (' + MAX_ARTIFACT_UPDATE + ') at index = ' + myUpdIndex, CONSOLE_INFO);

      myArtifactUpdListCopy = myArtifactUpdList.slice(myUpdIndex, myUpdIndex + MAX_ARTIFACT_UPDATE);

      myUpdIndex += MAX_ARTIFACT_UPDATE;

      RM.Data.setAttributes(myArtifactUpdListCopy, function (result) { // ---- Call RM API to update attributes
         $("#" + GUI_ITEM_NBARTANALYSE).text(g_LogReport.nbScannedArtifacts);

         // ---- Set update status for each modified artifact

         result.data.forEach(function (myArtifact) {
            if (myArtifact.code === RM.OperationResult.OPERATION_OK) {
               g_LogReport.nbUpdatedArtifacts++;

               $("#" + GUI_ITEM_NBARTMODIFIED).text(g_LogReport.nbUpdatedArtifacts);
            }
         });

         // ---- Manage batch update action and status

         if (result.code === RM.OperationResult.OPERATION_OK) { // ---- All artifacts in batch are correctly saved
            mgt_Console(set_Attributes.name + " : Successful update for block at index " + myUpdIndex, CONSOLE_INFO);

            // ---- Compute the next block with a direct recursive call

            set_Attributes(artifactList, myUpdIndex);
         } else { // ---- Not all artifacts are correctly saved
            mgt_Console(set_Attributes.name + " : Failed update for block at index " + myUpdIndex, CONSOLE_ERROR);

            gui_MgtProgressIndicator(GUI_ITEM_UPDATE_ROOT, IS_ERROR);

            $("#" + GUI_ITEM_MSGERROR).text("Failed to set attribute values !").show();

            gui_mgtActionButtons(ACTION_ACTIVE_ON);
         }
      });
   } else { // ---- End of batch update
      mgt_Console(set_Attributes.name + ' : batch update is finished !', CONSOLE_INFO);

      gui_MgtProgressIndicator(GUI_ITEM_UPDATE_ROOT, IS_SUCCESS);

      // ---- Enable buttons

      gui_mgtActionButtons(ACTION_ACTIVE_ON);
   }
}

/**
 * Resize (or reset) embedded images in artifact Primary Text
 * @param {Object} artifactRef - Artifact (reference + attributes)
 * @param {Number} imageWidth - Target image width in pixels, "null" to reset images to their original size
 * @param {Map} sizeCache - Image natural size cache (key = image URL)
 * @return - Promise resolved with modified artifact, else "null"
 */

async function content_resizeImage(artifactRef, imageWidth, sizeCache) {
   let myNewPrimaryText;
   let myPrimaryText = artifactRef.values[RM.Data.Attributes.PRIMARY_TEXT];

   // ---- Skip non-Text format artifacts

   if (artifactRef.values[RM.Data.Attributes.FORMAT] !== RM.Data.Formats.TEXT) {
      return null;
   }

   myNewPrimaryText = await resizeEmbeddedImages(myPrimaryText, imageWidth, sizeCache);

   // ---- Return resized artifact

   if (myNewPrimaryText !== null && myNewPrimaryText !== myPrimaryText) {
      artifactRef.values[RM.Data.Attributes.PRIMARY_TEXT] = myNewPrimaryText;

      return artifactRef;
   } else { // ---- No embedded image found, nothing to update !
      return null;
   }
}

/**
 * Read the natural size of an image stored in a Blob
 * - The Blob is decoded by the browser through a temporary "object URL"
 * @param {Blob} blob - Image content (response body)
 * @returns - Promise resolved with {width, height}, else "null" if the Blob is not a decodable image
 */

function getBlobImageSize(blob) {
   return new Promise(function (resolve) {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = function () {
         const mySize = { width: img.naturalWidth, height: img.naturalHeight };

         URL.revokeObjectURL(objectUrl);
         resolve(mySize.width > 0 && mySize.height > 0 ? mySize : null);
      };

      img.onerror = function () {
         URL.revokeObjectURL(objectUrl);
         resolve(null);
      };

      img.src = objectUrl;
   });
}

/**
 * Get the natural size of an image stored in ERM (wrappedResources URL)
 * - Downloads the resource in the current configuration context, checks the
 *   "Content-Type" header, then decodes the body
 * @param {String} imageUrl - Image URL (value of the "src" attribute)
 * @param {Map} sizeCache - Image natural size cache (key = image URL)
 * @returns - Promise resolved with {width, height}, else "null"
 */

async function getImageSize(imageUrl, sizeCache) {
   let mySize = null;
   let myRequestUrl = imageUrl;

   if (sizeCache.has(imageUrl)) {
      return sizeCache.get(imageUrl);
   }

   try {
      myRequestUrl = config_addContext(imageUrl, g_ConfigContext.contextUri);

      const response = await fetch(myRequestUrl, { credentials: "include", cache: "no-store" });
      const contentType = (response.headers.get("Content-Type") || "").toLowerCase();

      if (!response.ok) {
         mgt_Console(getImageSize.name + " : HTTP " + response.status + " for '" + myRequestUrl + "'", CONSOLE_WARNING);
      } else if (!contentType.startsWith("image/")) {
         mgt_Console(getImageSize.name + " : Not an image (Content-Type = '" + contentType + "') for '" + myRequestUrl + "'", CONSOLE_WARNING);
      } else {
         mySize = await getBlobImageSize(await response.blob());
      }
   } catch (error) {
      mgt_Console(getImageSize.name + " : Failed to read '" + myRequestUrl + "' : " + error, CONSOLE_WARNING);
   }

   sizeCache.set(imageUrl, mySize);

   return mySize;
}

/**
 * Check if an image is embedded in the artifact
 * - "alt" attribute is "Embedded Image" (case-insensitive), or "src" is an ERM wrapped resource
 * @param {Element} img - Image element
 * @returns - "true" if the image is embedded
 */

function isEmbeddedImage(img) {
   const myAlt = (img.getAttribute('alt') || '').toLowerCase();
   const mySrc = img.getAttribute('src') || '';

   return myAlt === EMBEDDED_IMAGE_ALT || mySrc.indexOf(WRAPPED_RESOURCE_PATH) > -1;
}

/**
 * Check if an image has a size modifier : "width" or "height" attribute, or in the "style" attribute
 * @param {Element} img - Image element
 * @returns - "true" if a size modifier is found
 */

function hasImageSize(img) {
   return img.hasAttribute('width') || img.hasAttribute('height') || img.style.width !== '' || img.style.height !== '';
}

/**
 * Remove the size modifiers of an image : "width" and "height" attributes, and in the "style" attribute
 * - Other style properties are kept, the "style" attribute is removed if it becomes empty
 * @param {Element} img - Image element
 */

function removeImageSize(img) {
   img.removeAttribute('width');
   img.removeAttribute('height');

   if (img.hasAttribute('style')) {
      img.style.removeProperty('width');
      img.style.removeProperty('height');

      if (img.style.length === 0) {
         img.removeAttribute('style');
      }
   }
}

/**
 * Resize (or reset) embedded images in an HTML string
 * - The size of an image may be set by "width", "width" and "height", or in the "style" attribute :
 *   in all cases, it is replaced by "width" and "height" attributes only
 * - Resize : width is set to the value entered in the widget, and height is
 *   computed from the image natural size to preserve proportionality
 *   (if the natural size cannot be read, height is removed : browser keeps the ratio)
 * - Reset (imageWidth = null) : size modifiers are removed, image is displayed at its original size
 * @param {String} htmlString - HTML string to process
 * @param {Number} imageWidth - Target image width in pixels, "null" to reset images to their original size
 * @param {Map} sizeCache - Image natural size cache (key = image URL)
 * @returns - Promise resolved with updated HTML string, else "null"
 */

async function resizeEmbeddedImages(htmlString, imageWidth, sizeCache) {
   if (!htmlString || typeof htmlString !== 'string') {
      return null;
   }

   const parser = new DOMParser();
   const doc = parser.parseFromString(htmlString, 'text/html');
   const body = doc.body;

   // ---- Si un objet "embedded resource decorator" est présent, on ne touche à rien
   const hasEmbeddedDecorator = Array.from(body.querySelectorAll('*')).some(el =>
      Array.from(el.classList).some(cls => cls.toLowerCase() === 'com-ibm-rdm-editor-embeddedresourcedecorator')
   );

   // ---- On récupère toutes les images, puis on garde les images incluses
   const embeddedImages = Array.from(body.querySelectorAll('img')).filter(isEmbeddedImage);

   if (hasEmbeddedDecorator || embeddedImages.length === 0) {
      if (hasEmbeddedDecorator) {
         mgt_Console(resizeEmbeddedImages.name + ' : Embedded Resource Decorator found, skipping image resizing.', CONSOLE_WARNING);
      }
      
      return null;
   } else if (imageWidth === null) {
      // ---- Reset : only images with a size modifier must be changed

      const sizedImages = embeddedImages.filter(hasImageSize);

      if (sizedImages.length === 0) {
         return null;
      }

      sizedImages.forEach(removeImageSize);

      return body.innerHTML;
   } else {
      for (const img of embeddedImages) {
         const mySize = await getImageSize(img.getAttribute('src'), sizeCache);

         // ---- Previous size (attributes or style) is replaced by "width" and "height" attributes

         removeImageSize(img);

         img.setAttribute('width', imageWidth);

         if (mySize !== null) {
            // ---- Keep proportionality : height = width * (natural height / natural width)
            img.setAttribute('height', Math.max(1, Math.round(imageWidth * mySize.height / mySize.width)));
         }
      }

      return body.innerHTML;
   }
}

/* --------------------------------------------------------------------------- */

/**
 * Callback on "Update" button event
 */

function btnupdate_artifact() {
   let myImageWidth = parseInt($("#" + GUI_ITEM_IMAGE_WIDTH).val(), 10);

   mgt_Console(btnupdate_artifact.name + ' : Update Data Model - Resize Image Mode', CONSOLE_INFO);

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

   resize_primaryText(g_Artifact.artList, myImageWidth);
}

/**
 * Callback on "Reset" button event
 * - Removes width and height of embedded images (original size)
 */

function btnreset_artifact() {
   mgt_Console(btnreset_artifact.name + ' : Update Data Model - Reset Image Mode', CONSOLE_INFO);

   $("#" + GUI_ITEM_MSGERROR).hide();

   resize_primaryText(g_Artifact.artList, null);
}

/**
 * Enable / disable all action buttons ("Resize Image" and "Reset Image")
 * @param {String} action - Action (ACTION_ACTIVE_ON, ACTION_ACTIVE_OFF)
 */

function gui_mgtActionButtons(action) {
   gui_mgtButtonDrop(GUI_ITEM_UPDATE_BTN_ROOT, action);
   gui_mgtButtonDrop(GUI_ITEM_RESET_BTN_ROOT, action);
}

/**
 * Attach button handlers
 */

function gui_eventHandler() {
   $('#' + GUI_ITEM_UPDATE_BTN_ROOT + GUI_TARGET_BTN).on('click', btnupdate_artifact);
   $('#' + GUI_ITEM_RESET_BTN_ROOT + GUI_TARGET_BTN).on('click', btnreset_artifact);
}

/* --------------------------------------------------------------------------- */

/** Initialisation de l'IHM du widget */

function view_init() {

   // ---- GUI Init

   gui_eventHandler();

   gui_mgtActionButtons(ACTION_ACTIVE_OFF);

   $("#" + GUI_ITEM_MODULE_NAME).text("*** Select a Module ! ***");

   // ---- RM : subscribe to event client 

   RM.Event.subscribe(RM.Event.ARTIFACT_OPENED, rm_artifactOpen);
   RM.Event.subscribe(RM.Event.ARTIFACT_CLOSED, rm_artifactClose);
   RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, rm_artifactSelect);
}

