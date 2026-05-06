/*******************************************************************************/
/*                    (C) Copyright 2019 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/
/*
+-------------------------------------------------------------------------------+
| Revision |    Date    |     Author     |                Issue                 |
+-------------------------------------------------------------------------------+
|     1    | JJ/MM/AAAA |   Safran       | Initial version                      |
+-------------------------------------------------------------------------------+
*/

/* ------------------------------------------------------------------------------
	---- Constantes
   --------------------------------------------------------------------------- */

const CONSOLE_INFO			= "--- INFO : ";
const CONSOLE_WARNING		= "§§§ WARN : ";
const CONSOLE_ERROR			= "### ERROR : ";   

/* ------------------------------------------------------------------------------
   ---- Classes
   --------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------
   ---- Variables globales
   --------------------------------------------------------------------------- */
   
/* ------------------------------------------------------------------------------
   ---- Core Fonctions
   --------------------------------------------------------------------------- */

/**
 * Generate HTML from HTML template
 * @param {String} templName - Template Name
 * @param {Object} context - Template Parameters
 * @returns - HTML Content
 */

function gui_htmlfromtemplate (templName, context) {
	let myHtmlTemplate = $("#" + templName);
	let myTemplate;
	let myTemplSrc;
	let myHtmlContent;
 
	myTemplSrc = myHtmlTemplate.html();
	myTemplate = Handlebars.compile(myTemplSrc);
 
	myHtmlContent = myTemplate (context);
 
	return myHtmlContent;
}

/**
 * Compare property "name" from array of objects
 */

function compareName (a, b) {
	// Use toUpperCase() to ignore character casing
 
	const nameA = a.name.toUpperCase();
	const nameB = b.name.toUpperCase();
 
	let comparison = 0;
 
	if (nameA > nameB) {
	   comparison = 1;
	} else if (nameA < nameB) {
	   comparison = -1;
	}
 
   return comparison;
 }
 
/**
 * Manage console messages
 * @param {String} consMsg - Console message
 * @param {String} status - Message type (optional, CONSOLE_INFO, CONSOLE_WARNING, CONSOLE_ERROR)
 */

function mgt_Console (msgText, msgType) {
	let myMsgPrefix;

	switch (msgType) {
		case CONSOLE_INFO:
			myMsgPrefix = CONSOLE_INFO;
		break;
		
		case CONSOLE_WARNING:
			myMsgPrefix = CONSOLE_WARNING;
		break;

		case CONSOLE_ERROR:
			myMsgPrefix = CONSOLE_ERROR;
		break;
			
		default: // ---- Option
			myMsgPrefix = CONSOLE_INFO;
	}

	console.log (myMsgPrefix + msgText);
}

/* --------------------------------------------------------------------------- */

/**
 * Get <UserPref> parameters from a Jazz widget
 * @param {String} sUserPrefName - Parameter name
 * @returns - Value form widget parameter
 */

 function widget_get_UserPref (sUserPrefName) {
	let sValue = '';
	let prefs  = new gadgets.Prefs();

	sValue = prefs.getString(sUserPrefName);

	return sValue;
}
