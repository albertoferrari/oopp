/** @license
* Visual Blocks Language
*
* Copyright 2012 Google Inc.
* https://developers.google.com/blockly/
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

/**
* @fileoverview Generate Java code for class blocks.
* @author SoWIDE Lab - DIA University of Parma
*/
'use strict';

goog.provide('Blockly.Java.classes');
goog.require('Blockly.Java');

/**
* Convert the type of an object
* @param {String} ot object type
* @return {String} Java code for type
*/
function object_java_type_conversion (ot) {
  var code_type = new Array();
  code_type['BYTE'] = 'byte';
  code_type['SHORT'] = 'short';
  code_type['INTEGER'] = 'int';
  code_type['LONG'] = 'long';
  code_type['FLOAT'] = 'float';
  code_type['DOUBLE'] = 'double';
  code_type['CHAR'] = 'char';
  code_type['BOOLEAN'] = 'boolean';
  return code_type[ot];
}

/**
* Convert the visibility of class/method ...
* @param {String} key visibility
* @return {String} Java code for visibility
*/
function object_java_visibility_conversion (key) {
  var code_modifier = new Array();
  code_modifier['PUBLIC'] = 'public';
  code_modifier['PROTECTED'] = 'protected';
  code_modifier['PACKAGE'] = '';
  code_modifier['PRIVATE'] = 'private';
  return code_modifier[key];
}

/**
* Convert the class block into Java Code
* @param {Block} block class getter block
* @return {String} Java code for the class getter
*/
Blockly.Java['classes_get'] = function(block) {
  // Do not generate if it's not connected
  if (!block.getSurroundParent()) {return '';}

  var code = Blockly.Java.classDB_.getName(block.getFieldValue('CLASS'),
    Blockly.Classes.NAME_TYPE);
  return [code, Blockly.Java.ORDER_ATOMIC];
};


/**
* Convert the class definition into Java Code
* @param {Block} block class setter block
* @return {String} Java code for the class setter
*/
Blockly.Java['classes_set'] = function(block) {
  var statements_package = block.getFieldValue('PACKAGE');
  var objName = Blockly.Java.classDB_.getName(block.getFieldValue('CLASS'), Blockly.Classes.NAME_TYPE);

  // Do not generate if it's a library
  if (block.getFieldValue('LIB') == 'TRUE') {
    if (!statements_package) {
      return '// ERROR: Cannot create library import with no package specified - ' + objName;
    }
    return 'import ' + statements_package + '.' + objName + ';';
  }

  var statements_fields = Blockly.Java.statementToCode(block, 'FIELDS');
  var statements_constructors = Blockly.Java.statementToCode(block, 'CONSTRUCTORS');
  var statements_methods = Blockly.Java.statementToCode(block, 'METHODS');

  var code = "";
  var interfacesForCode = '';
  var allInterfaces = '';
  var implementedInterfaces = [];           // Interfaces implemented by this class
  var inter = [];

  // Package
  if (statements_package) { code += 'package ' + statements_package + ';\n';}

  // Class name
  code += 'public class ' + objName;

  // Extends (INSERT_CLASS)
  if (block.extendsCount) {
    var classFromExtend = Blockly.Java.valueToCode(block, 'INSERT_CLASS',Blockly.Java.ORDER_ADDITION);
    code += ' extends ' + classFromExtend;
    var workspaceBlocks = Blockly.mainWorkspace.getAllBlocks();	//All blocks of the workspace
    var classExtended = this.getInputTargetBlock('INSERT_CLASS') ;
    var methodsOfOverClass=[];
    var classMethods= [];               // Names of methods defined in this class
    var classMethodsAndOverClass=[];
    var methodsOfInterfaceOfClass=[];
    var methodsOfErrorInterface=[];   // Array used to find the interfaces where methods are not implemented
    var methods_absent_inheritance=[];
    var errorListInheritance=[];
    var Interface_inheritance_Error=[]; // // Array which inform about the interfaces where methods are not implemented

    //  Search for methods defined in this class
    var childmethods = this.getInputTargetBlock('METHODS');
    do {
      if(childmethods){
        classMethods.push(childmethods.getFieldValue('NAME'));
        if(childmethods.getNextBlock){
          childmethods=childmethods.getNextBlock();
        }
      }
    } while(childmethods);

    // Search for interfaces implemented by this class
    for (var j=0; j<workspaceBlocks.length; j++){
      if (workspaceBlocks[j].getInput('CLASS_NAME')){
        if (classExtended==workspaceBlocks[j].getFieldValue('CLASS')){
          if (this.interfaceCount>0){
            for (var i=0; i<this.interfaceCount;i++){
              implementedInterfaces.push(this.getInputTargetBlock('ADD' + i));
              code += Blockly.Msg.OOP_IMPLEMENTS;
              var interfaceFromImplement = Blockly.Java.valueToCode(block, 'ADD'+i,Blockly.Java.ORDER_ADDITION);
              interfacesForCode += interfaceFromImplement + ',';
            }

            // Array of the methods of all the interfaces implemented by the class
            var workspaceBlocks2 = Blockly.mainWorkspace.getAllBlocks();
            for(var m=0; m< implementedInterfaces.length;m++){
              for(var k=0; k< workspaceBlocks2.length;k++){
                if (workspaceBlocks2[k].getInput('INTERFACE_NAME')){
                  if (implementedInterfaces[m]==workspaceBlocks2[k].getFieldValue('INTERFACE')){
                    var childMethodsOfInterfaceOfClass = workspaceBlocks2[k].getInputTargetBlock('METHODS');
                    do{
                      if(childMethodsOfInterfaceOfClass){
                        methodsOfInterfaceOfClass.push(childMethodsOfInterfaceOfClass.getFieldValue('NAME'));
                        if(childMethodsOfInterfaceOfClass.getNextBlock){
                          childMethodsOfInterfaceOfClass=childMethodsOfInterfaceOfClass.getNextBlock();
                        }
                      }
                    }while(childMethodsOfInterfaceOfClass);

                  }
                }
              }
            }

            // Array of the the methods of the superclass
            var childMethodsOfOverClass = workspaceBlocks[j].getInputTargetBlock('METHODS');
            do{
              if(childMethodsOfOverClass){
                methodsOfOverClass.push(childMethodsOfOverClass.getFieldValue('NAME'));
                if(childMethodsOfOverClass.getNextBlock){
                  childMethodsOfOverClass=childMethodsOfOverClass.getNextBlock();
                }
              }
            }while(childMethodsOfOverClass);
            classMethodsAndOverClass=classMethods.concat(methodsOfOverClass); // Array of the methods of the class and of the overclass

            for (var l=0; l< methodsOfInterfaceOfClass.length;l++){
              if (classMethodsAndOverClass.indexOf(methodsOfInterfaceOfClass[l])==-1){	// If a method of the array classMethodsAndOverClass is
                methods_absent_inheritance.push(methodsOfInterfaceOfClass[l]);		// absent from the methods of an interface, we note the method
              }
            }
            if (methods_absent_inheritance.length != 0){ 						//If there is effectively at least one absent method
              for(var m=0; m< implementedInterfaces.length;m++){
                for (var k=0; k < workspaceBlocks2.length; k++){
                  if (workspaceBlocks2[k].getInput('INTERFACE_NAME')){
                    if (implementedInterfaces[m]==workspaceBlocks2[k].getFieldValue('INTERFACE')){
                      var childOfErrorInterface=workspaceBlocks2[k].getInputTargetBlock('METHODS');
                      do{
                        if(childOfErrorInterface){
                          methodsOfErrorInterface.push(childOfErrorInterface.getFieldValue('NAME'));
                          for(var n=0; n < methods_absent_inheritance.length;n++){
                            if (methods_absent_inheritance[n]==childOfErrorInterface.getFieldValue('NAME')){
                              if(Interface_inheritance_Error.indexOf(implementedInterfaces[m])==-1){
                                Interface_inheritance_Error.push(implementedInterfaces[m]);		//We note the name of the interfaces concerned
                              }
                            }
                          }
                          if(childOfErrorInterface.getNextBlock){
                            childOfErrorInterface=childOfErrorInterface.getNextBlock();
                          }
                        }
                      }while(childOfErrorInterface);
                    }
                  }
                }
              }
              errorListInheritance.push(false);  //Flag error
            }

            if (methods_absent_inheritance.length == 0){
              errorListInheritance.push(true);  //Flag no error
            }
            var methods_absent_inheritance_bis = methods_absent_inheritance; // Copy of methods_absent_inheritance
            methods_absent_inheritance=[];
          }
        }
      }
    }

    if(errorListInheritance.indexOf(false)!=-1) { //If there is at least one error
      var errorInheritance = Blockly.Msg.OOP_ERROR_METHODS + Blockly.Msg.OOP_ERROR_DETAILS_METHODS +  methods_absent_inheritance_bis
      + Blockly.Msg.OOP_ERROR_DETAILS_INTERFACE + Interface_inheritance_Error + Blockly.Msg.OOP_ERROR_DETAILS_CLASS
      + objName + Blockly.Msg.OOP_ERROR_DETAILS_OVERCLASS + classExtended;  // Error Message
      var textarea = document.getElementById('text_code');
      textarea.value=errorInheritance; // We display the error message in the code area
    }

    if(errorListInheritance.indexOf(false)==-1) {
      code+= interfacesForCode;  // We return the code
      code = code.replace(/,\s*$/, "");
      code += ' {\n' + statements_fields + '\n';
      code += statements_constructors + '\n';
      code += statements_methods + '\n' + '}\n';
      return code;
    }
  }

  // Implements (ADD)
  else if (block.interfaceCount) { // if interface(s) is/are implemented
    var total_statement = '';
    code += Blockly.Msg.OOP_IMPLEMENTS;
    var interfacesBlocks = Blockly.mainWorkspace.getAllBlocks();	//All blocks of the workspace
    var interfacesImplemented = [];
    var errorlist=[];
    var methods_absent = [];
    for (var i = 0; i < block.interfaceCount; i++) {
      var interfaceFromImplement = Blockly.Java.valueToCode(block, 'ADD'+i,Blockly.Java.ORDER_ADDITION); // Return the code for the blocks after the "implement" of the class
      interfacesForCode += interfaceFromImplement + ',';
      var childImplement = this.getInputTargetBlock('ADD' + i);
      interfacesImplemented.push(childImplement); // list of interfaces implemented
    }
    for (var m =0; m < interfacesImplemented.length; m++){ // For all interfaces implemented
      for (var j = 0; j < interfacesBlocks.length; j++) {		 // For all the blocks of the workspace
        if (interfacesBlocks[j].getInput('INTERFACE_NAME')) { //If these blocks are interfaces
          if (interfacesImplemented[m]==interfacesBlocks[j].getFieldValue('INTERFACE')){// if a block interface has the same name of a block implemented
            var methods_class_name = [];
            var child = this.getInputTargetBlock('METHODS'); // The method of the block Class
            do {
              if (child){ //if there is a method
                methods_class_name.push(child.getFieldValue('NAME')); // The methods are added to the Array of the metods of the Class
                if (child.getNextBlock){  // if there are others methods
                  child=child.getNextBlock(); //Next block
                }
              }
            } while(child);
            var methods_interface_name=[];
            var child_bis = interfacesBlocks[j].getInputTargetBlock('METHODS'); // The method the block Interface
            do {
              if (child_bis){ // if there is a method
                methods_interface_name.push(child_bis.getFieldValue('NAME'));  // The methods are added to the Array of the methods of the Interface
                if (child_bis.getNextBlock){  // if there are others methods
                  child_bis=child_bis.getNextBlock(); //Next block
                }
              }
            }while(child_bis);
            for(var k=0;k<methods_interface_name.length;k++){
              if (methods_class_name.indexOf(methods_interface_name[k])== -1){ // if the methods of the Array Class don't have one a several methods of the Array interface
              methods_absent.push(methods_interface_name[k]); // we note the missing methods
            }
          }
            if (methods_absent.length != 0){  // if there (are/is) one or several method(s) of the interface which (are/is) not implemented in the Class
              var InterfaceError=interfacesBlocks[j].getFieldValue('INTERFACE');  // we note the interface concerned
              errorlist.push(false);     //Flag error
              var methods_absent_bis = methods_absent; // Copy of methods_absent
            }

            if (methods_absent.length == 0){
              errorlist.push(true);  //Flag no error
            }
            methods_absent=[];   // We clear the list of absent methods
          }
        }
      }
    }
    if (errorlist.indexOf(false)!=-1) { //If there is at least one error
      var error = Blockly.Msg.OOP_ERROR_METHODS + Blockly.Msg.OOP_ERROR_DETAILS_METHODS +  methods_absent_bis + Blockly.Msg.OOP_ERROR_DETAILS_INTERFACE
      + InterfaceError + Blockly.Msg.OOP_ERROR_DETAILS_CLASS + objName ;  // Error Message
      var textarea = document.getElementById('text_code');
      textarea.value=error; // We display the error message in the code area
    }
    else {
      code+= interfacesForCode;  // We return the code
      code = code.replace(/,\s*$/, "");
      if (statements_fields) {code += ' {\n' + statements_fields + '\n';}
      if (statements_constructors) {code += statements_constructors + '\n';}
      if (statements_methods) {code += statements_methods + '\n' + '}\n';}
      return code;
    }
  }

  // Just the code
  else {
    code = code.replace(/,\s*$/, "");
    code += ' {\n' + statements_fields + '\n';
    code += statements_constructors + '\n';
    code += statements_methods + '\n' + '}\n';
    return code;
  }
};

/**
* Convert the object type into Java Code
* @param {Block} block Primitive Data Type block
* @return {String} Java Code for the object type
*/
Blockly.Java['object_type'] = function(block) {
  // Do not generate if it's not connected
  if (!block.getSurroundParent()) {return '';}

  var dropdown_type_name = block.getFieldValue('TYPE_NAME');
  var code = object_java_type_conversion (dropdown_type_name);
  return [code, Blockly.Java.ORDER_ATOMIC];
};

/**
* Convert the class field into Java Code
* @param {Block} block Field block
* @return {String} Java Code for the class field
*/
Blockly.Java['classes_field'] = function(block) {
  // Get the field and his values
  var name = block.getFieldValue('NAME');
  var type = Blockly.Java.valueToCode(block, 'TYPE', Blockly.Java.ORDER_ATOMIC);
  var visibility = block.getFieldValue('VISIBILITY');
  var visibility_code = object_java_visibility_conversion (visibility)
  var code = (visibility_code ? visibility_code + ' ' : '') + type + ' ' + name + ';\n';

  if (!name || !type) {return '';}
  return code;
};

/**
* Convert the class parameter into Java Code
* @param {Block} block Parameter block
* @return {String} Java Code for the class parameter
*/
Blockly.Java['classes_parameter'] = function(block) {
  // Do not generate if it's not connected
  if (!block.getSurroundParent()) {return '';}

  var name = block.getFieldValue('NAME');
  var type = Blockly.Java.valueToCode(block, 'TYPE', Blockly.Java.ORDER_ATOMIC);
  var code = type + ' ' + name + ',';

  if (!type || !name) {return '';}
  return code;
};

/**
* Convert the class constructor into Java Code
* @param {Block} block Constructor block
* @return {String} Java Code for the class constructor
*/
Blockly.Java['classes_constructor'] = function(block) {
  // Not connected? Don't show useless code
  if (!block.getSurroundParent()) {return '';}

  var statements_param = Blockly.Java.statementToCode(block, 'PARAM');
  var parent = block.getSurroundParent();
  var code = '';
  if (parent.getFieldValue('CLASS')) {
    var visibility_code = object_java_visibility_conversion(block.getFieldValue('VISIBILITY'));
    if (!visibility_code) {visibility_code = 'public'}
    code = visibility_code ? visibility_code + ' ' : '';

    code += parent.getFieldValue('CLASS') + '(';
    code += statements_param;
    code = code.replace(/,\s*$/, "");
    code += ') {\n';
    code += Blockly.Msg.OOP_INSERT_YOUR_CODE + "}\n"
  }
  return code;
};

/**
* Convert the method (without return statement) into Java Code
* @param {Block} block Method block
* @return {String} Java Code for the object method
*/
Blockly.Java['object_method'] = function(block) {
  // Not connected? Don't show useless code
  if (!block.getSurroundParent()) {return '';}

  var name = block.getFieldValue('NAME');
  var visibility = block.getFieldValue('VISIBILITY');
  var statements_param = Blockly.Java.statementToCode(block, 'PARAM');
  //statements_param = statements_param.replace(/,\s*$/, "");
  var visibility_code = object_java_visibility_conversion (visibility)
  var parent = block.getSurroundParent();
  if (!name) {return '';}

  if (parent.getFieldValue('CLASS')) {
    var code = (visibility_code ? visibility_code + ' ' : '') + 'void ' + name + '(';
    code += statements_param.trim();
    code = code.replace(/,\s*$/, ""); // Add space after comma
    code += ') {\n';
    code += Blockly.Msg.OOP_INSERT_YOUR_CODE + "}\n"
  } else if (parent.getFieldValue('INTERFACE')) {
    var code = visibility_code + ' void ' + name + '(' + statements_param.trim();
    code = code.replace(/,\s*$/, "");
    code += ');\n';
  }
  return code;
};

/**
* Convert the method (with return statement) into Java Code
* @param {Block} block Method with return block
* @return {String} Java Code for the object method with return
*/
Blockly.Java['object_method_return'] = function(block) {
  // Not connected? Don't show useless code
  if (!block.getSurroundParent()) {return '';}

  // Get the method with a return value and his parameters
  var name = block.getFieldValue('NAME');
  var visibility = block.getFieldValue('VISIBILITY');
  var statements_param = Blockly.Java.statementToCode(block, 'PARAM');
  var value_ret = Blockly.Java.valueToCode(block, 'RET', Blockly.Java.ORDER_ATOMIC);
  var visibility_code = object_java_visibility_conversion(visibility)
  var parent = block.getSurroundParent();
  if (!name) {return '';}

  if (parent.getFieldValue('CLASS')) {
    var code = (visibility_code ? visibility_code + ' ' : '');
    code += value_ret + ' ' + name + '(';
    code += statements_param.trim();
    code = code.replace(/,\s*$/, ""); // Add space after comma
    code += ') {\n';
    code += Blockly.Msg.OOP_INSERT_YOUR_CODE + "}\n"
  } else if (parent.getFieldValue('INTERFACE')) {
    var code = visibility_code + ' ' + value_ret + ' ' + name + '(';
    code += statements_param.trim();
    code = code.replace(/,\s*$/, ""); // Add space after comma
    code += ') {\n';
  }
  return code;
};
