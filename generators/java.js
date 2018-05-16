/**
* @license
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
* @fileoverview Helper functions for generating Java for blocks.
* @author SoWIDE Lab - DIA University of Parma
*/
'use strict';

goog.provide('Blockly.Java');
goog.require('Blockly.Generator');


/**
* Java code generator.
* @type {!Blockly.Generator}
*/
Blockly.Java = new Blockly.Generator('Java');

/**
* List of illegal names.
* This is not intended to be a security feature.  Blockly is 100% client-side,
* so bypassing this list is trivial.  This is intended to prevent users from
* accidentally clobbering a built-in object or function.
* @private
*/
Blockly.Java.addReservedWords(
  // import keyword
  // print ','.join(keyword.kwlist)
  // http://en.wikipedia.org/wiki/List_of_Java_keywords
  'abstract,assert,boolean,break,case,catch,class,const,continue,default,do,double,else,enum,extends,final,finally,float,for,goto,if,implements,import,instanceof,int,interface,long,native,new,package,private,protected,public,return,short,static,strictfp,super,switch,synchronized,this,throw,throws,transient,try,void,volatile,while,' +
  //http://en.wikipedia.org/wiki/List_of_Java_keywords#Reserved_words_for_literal_values
  'false,null,true,' +
  // http://docs.Java.org/library/functions.html
  'abs,divmod,input,open,staticmethod,all,enumerate,int,ord,str,any,eval,isinstance,pow,sum,basestring,execfile,issubclass,print,super,bin,file,iter,property,tuple,bool,filter,len,range,type,bytearray,float,list,raw_input,unichr,callable,format,locals,reduce,unicode,chr,frozenset,long,reload,vars,classmethod,getattr,map,repr,xrange,cmp,globals,max,reversed,zip,compile,hasattr,memoryview,round,__import__,complex,hash,min,set,apply,delattr,help,next,setattr,buffer,dict,hex,object,slice,coerce,dir,id,oct,sorted,intern,equal');
  /**
  * Order of operation ENUMs.
  * https://developer.mozilla.org/en/Java/Reference/Operators/Operator_Precedence
  */
  Blockly.Java.ORDER_ATOMIC = 0;         // 0 "" ...
  Blockly.Java.ORDER_MEMBER = 1;         // . []
  Blockly.Java.ORDER_NEW = 1;            // new
  Blockly.Java.ORDER_FUNCTION_CALL = 2;  // ()
  Blockly.Java.ORDER_INCREMENT = 3;      // ++
  Blockly.Java.ORDER_DECREMENT = 3;      // --
  Blockly.Java.ORDER_LOGICAL_NOT = 4;    // !
  Blockly.Java.ORDER_BITWISE_NOT = 4;    // ~
  Blockly.Java.ORDER_UNARY_PLUS = 4;     // +
  Blockly.Java.ORDER_UNARY_NEGATION = 4; // -
  Blockly.Java.ORDER_TYPEOF = 4;         // typeof
  Blockly.Java.ORDER_VOID = 4;           // void
  Blockly.Java.ORDER_DELETE = 4;         // delete
  Blockly.Java.ORDER_MULTIPLICATION = 5; // *
  Blockly.Java.ORDER_DIVISION = 5;       // /
  Blockly.Java.ORDER_MODULUS = 5;        // %
  Blockly.Java.ORDER_ADDITION = 6;       // +
  Blockly.Java.ORDER_SUBTRACTION = 6;    // -
  Blockly.Java.ORDER_BITWISE_SHIFT = 7;  // << >> >>>
  Blockly.Java.ORDER_RELATIONAL = 8;     // < <= > >=
  Blockly.Java.ORDER_IN = 8;             // in
  Blockly.Java.ORDER_INSTANCEOF = 8;     // instanceof
  Blockly.Java.ORDER_EQUALITY = 9;       // == != === !==
  Blockly.Java.ORDER_BITWISE_AND = 10;   // &
  Blockly.Java.ORDER_BITWISE_XOR = 11;   // ^
  Blockly.Java.ORDER_BITWISE_OR = 12;    // |
  Blockly.Java.ORDER_LOGICAL_AND = 13;   // &&
  Blockly.Java.ORDER_LOGICAL_OR = 14;    // ||
  Blockly.Java.ORDER_CONDITIONAL = 15;   // ?:
  Blockly.Java.ORDER_ASSIGNMENT = 16;    // = += -= *= /= %= <<= >>= ...
  Blockly.Java.ORDER_COMMA = 17;         // ,
  Blockly.Java.ORDER_NONE = 99;          // (...)

  /**
  * Allow for switching between one and zero based indexing, one based by
  * default.
  */
  Blockly.Java.ONE_BASED_INDEXING = true;


  /**
  * Initialise the database of object and variable names.
  * @param {!Blockly.Workspace} workspace Workspace to generate code from.
  */
  Blockly.Java.init = function(workspace) {
    // Create a dictionary of definitions to be printed before the code.
    Blockly.Java.definitions_ = Object.create(null);
    // Create a dictionary mapping desired function names in definitions_
    // to actual function names (to avoid collisions with user functions).
    Blockly.Java.functionNames_ = Object.create(null);

    if (!Blockly.Java.variableDB_) {
      Blockly.Java.variableDB_ =
      new Blockly.Names(Blockly.Java.RESERVED_WORDS_);
    } else {
      Blockly.Java.variableDB_.reset();
    }

    if (!Blockly.Java.classDB_) {
      Blockly.Java.classDB_ =
      new Blockly.Names(Blockly.Java.RESERVED_WORDS_);
    } else {
      Blockly.Java.classDB_.reset();
    }

    if (!Blockly.Java.interfaceDB_) {
      Blockly.Java.interfaceDB_ =
      new Blockly.Names(Blockly.Java.RESERVED_WORDS_);
    } else {
      Blockly.Java.interfaceDB_.reset();
    }

    var defvars = [];
    var variables = Blockly.Variables.allVariables(workspace);
    if (variables.length) {
      for (var i = 0; i < variables.length; i++) {
        defvars[i] = Blockly.Java.variableDB_.getName(variables[i],
          Blockly.Variables.NAME_TYPE);
        }
        Blockly.Java.definitions_['variables'] =
        'var ' + defvars.join(', ') + ';';
      }

    };

    /**
    * Prepend the generated code with the object and variable definitions.
    * @param {string} code Generated code.
    * @return {string} Completed code.
    */
    Blockly.Java.finish = function(code) {
      // Convert the definitions dictionary into a list.
      var definitions = [];
      for (var name in Blockly.Java.definitions_) {
        definitions.push(Blockly.Java.definitions_[name]);
      }
      // Clean up temporary data.
      delete Blockly.Java.definitions_;
      delete Blockly.Java.functionNames_;
      Blockly.Java.variableDB_.reset();
      Blockly.Java.classDB_.reset();
      Blockly.Java.interfaceDB_.reset();
      return definitions.join('\n\n') + '\n\n\n' + code;
    };

    /**
    * Naked values are top-level blocks with outputs that aren't plugged into
    * anything.  A trailing semicolon is needed to make this legal.
    * @param {string} line Line of generated code.
    * @return {string} Legal line of code.
    */
    Blockly.Java.scrubNakedValue = function(line) {
      return line + ';\n';
    };

    /**
    * Encode a string as a properly escaped Java string, complete with
    * quotes.
    * @param {string} string Text to encode.
    * @return {string} Java string.
    * @private
    */
    Blockly.Java.quote_ = function(string) {
      // Can't use goog.string.quote since Google's style guide recommends
      // JS string literals use single quotes.
      string = string.replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\\n')
      .replace(/'/g, '\\\'');
      return '\'' + string + '\'';
    };

    /**
    * Common tasks for generating Java from blocks.
    * Handles comments for the specified block and any connected value blocks.
    * Calls any statements following this block.
    * @param {!Blockly.Block} block The current block.
    * @param {string} code The Java code created for this block.
    * @return {string} Java code with comments and subsequent blocks added.
    * @private
    */
    Blockly.Java.scrub_ = function(block, code) {
      var commentCode = '';
      var paramCount_ = 0;
      var prefix_ = '/**' + '\n';
      var postfix_ ='\n'+' */'+'\n';

      // Do not generate if it's not connected (exclude classes and interfaces)
      if (!block.getSurroundParent() && !(block.type == 'classes_set') && !(block.type == 'interfaces_set')) {return '';}

      // Exclude libraries
      if ((block.getFieldValue('LIB') == 'TRUE')
        && ((block.type == 'classes_set')
        || (block.type == 'interfaces_set'))) {
        return code;
      }

      // Only collect comments for blocks that aren't inline.
      if (!block.outputConnection || !block.outputConnection.targetConnection) {
        // Collect comment for this block.
        var comment = block.getCommentText();
        if (comment) {
          commentCode+= prefix_;
          commentCode += Blockly.Java.prefixLines(comment, ' * ' );
          commentCode += postfix_;

        }
      }
      var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
      var nextCode = Blockly.Java.blockToCode(nextBlock);
      return commentCode + code + nextCode;
    };
