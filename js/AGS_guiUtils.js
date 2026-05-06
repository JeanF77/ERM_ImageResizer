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

// ---- Targets

const GUI_TARGET_BTN                         = "Btn";
const GUI_TARGET_BTNCONTENT                  = "BtnContent";
const GUI_TARGET_PAN                         = "Pan";
const GUI_TARGET_PAN_1                       = "Pan_1";
const GUI_TARGET_PAN_2                       = "Pan_2";
const GUI_TARGET_PAN_3                       = "Pan_3";
const GUI_TARGET_CONTENT                     = "Content";
const GUI_TARGET_LABEL                       = "Label";
const GUI_TARGET_ALERTCONTENT                = "AlertContent";

// ---- Other

const ACTION_INIT                            = "actionInit";
const ACTION_SETLABEL                        = "actionSetLabel";
const ACTION_SETCONTENT                      = "actionSetContent";
const ACTION_ACTIVE_ON                       = "actionActiveOn";
const ACTION_ACTIVE_OFF                      = "actionActiveOff";
const ACTION_DISP_ON                         = "actionDisplayOn";
const ACTION_DISP_OFF                        = "actionDisplayOff";

// ---- Some status

const IS_SUCCESS                             = "isSuccess";
const IS_ERROR                               = "isError";
const IS_WARNING                             = "isWarning";
const IS_INPROGRESS                          = "isInProgress";

/* ------------------------------------------------------------------------------
	---- Core Fonctions
   --------------------------------------------------------------------------- */

/**
  * "Button" and "Dropdown Button" management
  * @param {String} guiRoot - GUI Object root name
  * @param {String} action - Action (ACTION_INIT, ACTION_SETLABEL, ACTION_SETCONTENT, ACTION_ACTIVE_ON, ACTION_ACTIVE_OFF, ACTION_DISP_ON, ACTION_DISP_OFF)
  * @param {Array} content - Array of strings
  */

function gui_mgtButtonDrop (guiRoot, action, content) {
    let myGuiObj        = $("#" + guiRoot + GUI_TARGET_BTN);
    let myGuiObjContent = $("#" + guiRoot + GUI_TARGET_BTNCONTENT);
    let myHtmlContent   = "";
 
    switch (action) {
       case ACTION_INIT: // ---- Reset label and empty content
          myGuiObj.empty();
          myGuiObj.html(content);
          myGuiObjContent.empty();
 
          myGuiObj.show();
          myGuiObj.prop('disabled', true);
       break;
 
       case ACTION_SETLABEL: // ---- Set Button Label
          myGuiObj.empty();
          myGuiObj.html(content);
 
          myGuiObj.show();
       break;
 
       case ACTION_SETCONTENT: // ---- Set Button Content
          for (let myContent of content) {
             myHtmlContent += myContent;
          }
          myGuiObjContent.empty();
          myGuiObjContent.html(myHtmlContent);
       break;
 
       case ACTION_ACTIVE_ON: // ---- Activation and visible
          myGuiObj.prop('disabled', false);
          myGuiObj.show();
       break;
 
       case ACTION_ACTIVE_OFF: // ---- Deactivation and visible
          myGuiObj.prop('disabled', true);
          myGuiObj.show();
       break;
 
       case ACTION_DISP_ON: // ---- Display Button
          myGuiObj.show();
       break;
 
       case ACTION_DISP_OFF: // ---- Hide Button
          myGuiObj.hide();
       break;
 
       default:
          mgt_Console ('Unknown Button Action !', CONSOLE_WARNING);
    }
}

/**
 * Widget execution status indicator management
 * @param {String} guiID - GUI indicator root ID
 * @param {String} action - Action (ACTION_DISP_OFF, IS_INPROGRESS, IS_SUCCESS, IS_ERROR)
 */

function gui_MgtProgressIndicator (guiID, action) {
   let myLoadingInd = $("#" + guiID + GUI_STATUS_LOADING);
   let mySuccessInd = $("#" + guiID + GUI_STATUS_SUCESS);
   let myFailedInd = $("#" + guiID + GUI_STATUS_FAILED);

   switch (action) {
      case IS_INPROGRESS: // ---- Show progress indicator
         myLoadingInd.show ();
         mySuccessInd.hide ();
         myFailedInd.hide ();
      break;

      case IS_SUCCESS: // ---- Show success indicator
         myLoadingInd.hide ();
         mySuccessInd.show ();
         myFailedInd.hide ();
      break;

      case IS_ERROR: // ---- Show error indicator
         myLoadingInd.hide ();
         mySuccessInd.hide ();
         myFailedInd.show ();
      break;

      case ACTION_DISP_OFF: // ---- Hide all
         myLoadingInd.hide ();
         mySuccessInd.hide ();
         myFailedInd.hide ();
      break;
   
      default:
         mgt_Console ('Unknown Indicator Action !', CONSOLE_WARNING);
   }
}
