'use strict';

var block = null;
var workspace = null;
var autogen = OOPP_ENABLE_AUTOMATIC_CODE_GEN;
var javaSource = '';
var fr = new FileReader();

/**
 * Called on page load
 */
function start() {
  // Setup toolbox colours
  var col = function(categoryName, color) {
    document.querySelector('#toolbox > category[name="' + categoryName + '"]')
    .setAttribute('colour', color);
  }
  col('Classes', OOPP_COL.classes_set);
  col('Interfaces', OOPP_COL.interfaces_set);
  col('Methods', OOPP_COL.object_method);
  col('Fields', OOPP_COL.classes_field);
  col('Values', OOPP_COL.object_constant);

  // Initialize blockly
  OOPP_BLOCKLY_SETTINGS.toolbox = document.querySelector('#toolbox');
  OOPP_BLOCKLY_SETTINGS.rtl = (document.location.search == '?rtl');
	workspace = Blockly.inject('blocklyDiv', OOPP_BLOCKLY_SETTINGS);

  // Add event listener to input element, so a project is loaded every time a file is specified
  document.querySelector("#inputProjectXML").addEventListener('change', function(selectedFile) {
    var fileobj = selectedFile.target.files[0];
    fr.onload = function(project) {
      var xml = Blockly.Xml.textToDom(project.target.result);
      Blockly.Xml.domToWorkspace(xml, workspace);
      document.querySelector("#inputProjectXML").value = null; // Allow selecting again the same file
    };
    fr.readAsText(fileobj);
  }, false)

  // Change listener
  workspace.addChangeListener(function updateCodeRealtime(event) {
    if (autogen) {
      loadCode(Blockly.Java.workspaceToCode(workspace));
    }
  });


  // Keep nav open at startup
  openNav();

  // Refresh the button
  toggleAutomaticGeneration();
  toggleAutomaticGeneration();

  loadCode("Generated code...");
  document.querySelector('#version').innerHTML = OOPP_VERSION;
}

/**
 * Save generated code in a file with .java extension
 */
function saveCodeAsFile() {
	var textToSaveAsBlob = new Blob([javaSource], {type:"text/x-java-source"});
	var fileNameToSaveAs = "OOPP Code" + ".java";

  // Ugly hack: Safari does not download the blob, this at least opens a new tab
  saveAs(textToSaveAsBlob, fileNameToSaveAs);
}

/**
 * Save project (XML format) in a file with .oopp extension
 */
function saveProjectAsXML() {
	var xml = Blockly.Xml.workspaceToDom(workspace);
	var textToSave = Blockly.Xml.domToPrettyText(xml);
	var textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"}); // do not use xml... stupid safari
	var fileNameToSaveAs = "OOPP Project" + ".xml";

  // Ugly hack: Safari does not download the blob, this at least opens a new tab
  saveAs(textToSaveAsBlob, fileNameToSaveAs);
}

/**
 * Remove temporary element from the page
 * @param  {[type]} event [description]
 */
function destroyClickedElement(event) {
	document.body.removeChild(event.target);
}

/**
 * Load project from XML file
 * @param  {[type]} clear Remove stuff from the workspace first
 */
function insertBlocksFromXML() {
  document.querySelector("#inputProjectXML").click();
}

/**
 * Clear the current workspace
 */
function clearProject() {
  if (confirm("Are you sure you want to clear this project?")) {
    Blockly.mainWorkspace.clear();
  }
}

function loadCode(code) {
  document.querySelector('#generatedCodeArea').innerHTML = javaSource = code;
  hljs.highlightBlock(document.querySelector('#generatedCodeArea'));
}

function toggleAutomaticGeneration() {
  var button = document.querySelector("#autoGen");
  autogen = !autogen;
  if (autogen == true) {
    button.style.backgroundColor = "DodgerBlue";
    button.style.color = "white";
    loadCode(Blockly.Java.workspaceToCode(workspace));
  } else {
    button.style.backgroundColor = "#bbb";
    button.style.color = "black";
  }
}
