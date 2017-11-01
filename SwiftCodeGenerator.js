/*
 * Copyright (c) 2014 MKLab. All rights reserved.
 * Copyright (c) 2014 Sebastian Schleemilch.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, app, type, document, cpp */

define(function (require, exports, module) {
    "use strict";

    var _CPP_CODE_GEN_H = "h";
    var _CPP_CODE_GEN_CPP = "swift";

    var _CPP_PUBLIC_MOD = "public";
    var _CPP_PROTECTED_MOD = "fileprivate";
    var _CPP_PRIVATE_MOD = "private";

    var Repository     = app.getModule("core/Repository"),
        ProjectManager = app.getModule("engine/ProjectManager"),
        Engine         = app.getModule("engine/Engine"),
        FileSystem     = app.getModule("filesystem/FileSystem"),
        FileUtils      = app.getModule("file/FileUtils"),
        Async          = app.getModule("utils/Async"),
        UML            = app.getModule("uml/UML");

    var CodeGenUtils = require("CodeGenUtils");

    var copyrightHeader = "/* Test header @ toori67 \n * This is Test\n * also test\n * also test again\n */";
    var versionString = "v0.0.1";


    /**
     * Cpp code generator
     * @constructor
     *
     * @param {type.UMLPackage} baseModel
     * @param {string} basePath generated files and directories to be placed
     *
     */
    function CppCodeGenerator(baseModel, basePath) {

        /** @member {type.Model} */
        this.baseModel = baseModel;

        /** @member {string} */
        this.basePath = basePath;

        var doc = "";
        if (ProjectManager.getProject().name && ProjectManager.getProject().name.length > 0) {
            doc += "\nProject " + ProjectManager.getProject().name;
        }
        if (ProjectManager.getProject().author && ProjectManager.getProject().author.length > 0) {
            doc += "\n@author " + ProjectManager.getProject().author;
        }
        if (ProjectManager.getProject().version && ProjectManager.getProject().version.length > 0) {
            doc += "\n@version " + ProjectManager.getProject().version;
        }
        copyrightHeader = this.getDocuments(doc);
    }

    /**
     * Return Indent String based on options
     * @param {Object} options
     * @return {string}
     */
    CppCodeGenerator.prototype.getIndentString = function (options) {
        if (options.useTab) {
            return '\t';
        } else {

            var i, len, indent = [];
            for (i = 0, len = options.indentSpaces; i < len; i++) {
                indent.push(" ");
            }
            return indent.join("");
        }
    };


    CppCodeGenerator.prototype.generate = function (elem, path, options) {

        this.genOptions = options;

        var getFilePath = function (extenstions) {
            var abs_path = path + "/" + elem.name + ".";
            if (extenstions === _CPP_CODE_GEN_H) {
                abs_path += _CPP_CODE_GEN_H;
            } else {
                abs_path += _CPP_CODE_GEN_CPP;
            }
            return abs_path;
        };

        var writeEnumeration = function (codeWriter, elem, cppCodeGen) {
            var i;
            var modifierList = cppCodeGen.getModifiers(elem);
            var modifierStr = "";
            for (i = 0; i < modifierList.length; i++) {
                modifierStr += modifierList[i] + " ";
            }
            codeWriter.writeLine(modifierStr + "enum " + elem.name + " { \n\tcase "  + _.pluck(elem.literals, 'name').join("\n\tcase ")  + "\n}");
        };

        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var minute = date.getMinutes();
        var second = date.getSeconds();
            
        var writeClassHeader = function (codeWriter, elem, cppCodeGen, isPrivate) {
            var i;
            var tmpIsPrivate = isPrivate ? isPrivate : false;
            var write = function (items) {
                var i;
                for (i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (item instanceof type.UMLAttribute ||  item instanceof type.UMLAssociationEnd) { // if write member variable
                        codeWriter.writeLine(cppCodeGen.getMemberVariable(item, elem instanceof type.UMLInterface));
                    } else if (item instanceof type.UMLOperation) { // if write method
                        //codeWriter.writeLine(cppCodeGen.getMethod(item, false));
                    } else if (item instanceof type.UMLClass) {
                        writeClassHeader(codeWriter, item, cppCodeGen);
                    } else if (item instanceof type.UMLEnumeration) {
                        writeEnumeration(codeWriter, item, cppCodeGen);
                    }
                }
            };
            var writeInheritance = function (elem, isPrivate) {
                //if (isPrivate) {
                //    return "()";
                //}
                var inheritString = ": ";
                var genList = cppCodeGen.getSuperClasses(elem);

                if (genList.length === 0) {
                    return "";
                }

                var i;
                var term = [];

                if (genList.length > 0) {
                    var generalization = genList[0];
                    inheritString += generalization.target.name + " ";
                }

                for (i = 1; i < genList.length; i++) {
                    var general = genList[i];
                    // public AAA, private BBB
                    term.push(general.target.name);
                }
                if (term.length > 0) {
                    inheritString += ", ";
                    inheritString += term[0];
                    inheritString += "";
                }
                return inheritString;
            };
            var writeProtocol = function (elem, isPrivate) {

                var inheritString = "";
                var genList = cppCodeGen.getSuperClasses(elem);

                var i;
                var term = [];

                for (i = 0; i < genList.length; i++) {
                    var general = genList[i];
                    // public AAA, private BBB
                    term.push(general.target.name);
                }
                if (term.length > 0) {
                    inheritString += ", ";
                    inheritString += term[0];
                    inheritString += "";
                }
                return inheritString;
            };

            // member variable
            var memberAttr = elem.attributes.slice(0);
            var associations = Repository.getRelationshipsOf(elem, function (rel) {
                return (rel instanceof type.UMLAssociation);
            });
            for (i = 0; i < associations.length; i++) {
                var asso = associations[i];
                if (asso.end1.reference === elem && asso.end2.navigable === true && asso.end2.name.length !== 0) {
                    memberAttr.push(asso.end2);
                } else if (asso.end2.reference === elem && asso.end1.navigable === true && asso.end1.name.length !== 0) {
                    memberAttr.push(asso.end1);
                }
            }
            
            // method
            var methodList = elem.operations.slice(0);
            var innerElement = [];
            for (i = 0; i < elem.ownedElements.length; i++) {
                var element = elem.ownedElements[i];
                if (element instanceof type.UMLClass || element instanceof type.UMLEnumeration) {
                    innerElement.push(element);
                }
            }

            var allMembers = memberAttr.concat(methodList).concat(innerElement);

            var classfiedAttributes = cppCodeGen.classifyVisibility(allMembers);


            var finalModifier = "";
            if (elem.isFinalSpecialization === true || elem.isLeaf === true) {
                finalModifier = " final ";
            }
//            var templatePart = cppCodeGen.getTemplateParameter(elem);
//            if (templatePart.length > 0) {
//                codeWriter.writeLine(templatePart);
//            }
            var brief = elem.name + ' class';
            if (elem.documentation.length > 0) {
                brief = elem.documentation;
            }
            var docs = '@brief  ' + brief + '\n\n@author: uml \n\n@version: ' + year + '年' + month + '月' + day + '日 ' + hour + ':' + minute + ':' + second + '\n';
            //if (!isPrivate) {
            codeWriter.writeLine(cppCodeGen.getDocuments(docs));
            //}
            
            if (elem instanceof type.UMLInterface) {
                codeWriter.writeLine("protocol " + elem.name + " {");
            } else if ( elem instanceof type.UMLClass &&  elem.ownedElements.length > 0){
                var genList = cppCodeGen.getSuperClasses(elem);
                if (elem.ownedElements[0] instanceof type.UMLInterfaceRealization && !tmpIsPrivate) {
                    codeWriter.writeLine("public class " + elem.name + ": AnyObject"+ writeProtocol(elem, tmpIsPrivate) + " {");
                } else {
                    codeWriter.writeLine("public class " + elem.name + finalModifier + writeInheritance(elem, tmpIsPrivate) + " {");
                }
            } else {
                codeWriter.writeLine("public class " + elem.name + finalModifier + writeInheritance(elem, tmpIsPrivate) + " {");
            }
            
            if (classfiedAttributes._public.length > 0) {
                write(classfiedAttributes._public);
            } else {
                codeWriter.writeLine("\n");
            }
            if (classfiedAttributes._protected.length > 0) {
                write(classfiedAttributes._protected);
            }
            
            if (classfiedAttributes._private.length > 0) {
                write(classfiedAttributes._private);
            }
            if (!isPrivate) {
                codeWriter.writeLine("}\n");
            }
        };

        var writeClassBody = function (codeWriter, elem, cppCodeGen) {
            var i = 0;
            var item;
            var writeClassMethod = function (elemList) {

                for (i = 0; i < elemList._public.length; i++) {
                    item = elemList._public[i];
                    if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, true));
                    } else if (item instanceof type.UMLClass) {
                        writeClassBody(codeWriter, item, cppCodeGen);
                    }
                }

                for (i = 0; i < elemList._protected.length; i++) {
                    item = elemList._protected[i];
                    if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, true));
                    } else if (item instanceof type.UMLClass) {
                        writeClassBody(codeWriter, item, cppCodeGen);
                    }
                }

                for (i = 0; i < elemList._private.length; i++) {
                    item = elemList._private[i];
                    if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, true));
                    } else if (item instanceof type.UMLClass) {
                        writeClassBody(codeWriter, item, cppCodeGen);
                    }
                }
            };

            // parsing class
            var methodList = cppCodeGen.classifyVisibility(elem.operations.slice(0));

            // parsing nested class
            var innerClass = [];
            for (i = 0; i < elem.ownedElements.length; i++) {
                var element = elem.ownedElements[i];
                if (element instanceof type.UMLClass) {
                    innerClass.push(element);
                }
            }
            if (innerClass.length > 0) {
                innerClass = cppCodeGen.classifyVisibility(innerClass);
                writeClassMethod(innerClass);
            }
            
//            if (!elem.isAbstract) {
//                // General private @interface
//                writeClassHeader(codeWriter, elem, cppCodeGen, true);
//            }
//            var finalModifier = "";
//            if (elem.isFinalSpecialization === true || elem.isLeaf === true) {
//                finalModifier = "final ";
//            }
//            // General @implementation 
//            codeWriter.writeLine('public class ' + finalModifier + elem.name + ' {\n\n');
            writeClassHeader(codeWriter, elem, cppCodeGen, true);
            
            // General methods
            writeClassMethod(methodList);
            
            var _extends = cppCodeGen.getSuperClasses(elem);
            
            // Extends methods
            var extendsMethodList = [];
            extendsMethodList._public = [];
            extendsMethodList._protected = [];
            extendsMethodList._private = [];
            var extendsClassName;
            if (_extends.length > 0 && (_extends[0].target instanceof type.UMLClass ||
                _extends[0].target instanceof type.UMLInterface)) {
                if (_extends.length > 0 && _extends[0].target.operations.length > 0) {
                    var len = _extends[0].target.operations.length;
                    var found = false;
                    for (i = 0; i < len; i++) {
                        var _modifiers = cppCodeGen.getModifiers(_extends[0].target.operations[i]);
                        if( _.contains(_modifiers, "virtual") === true ) {
                            extendsClassName = _extends[0].target.name;
                            extendsMethodList._public.push(_extends[0].target.operations[i]);
                        }
                    }
                }
            }

            // General super class abstract methods
            if (extendsMethodList._public.length > 0) {
                codeWriter.writeLine('\n// MARK: - Extends from ' + extendsClassName);
                writeClassMethod(extendsMethodList);
            }
            
            if (elem.ownedElements.length > 0 && elem.ownedElements[0] instanceof type.UMLInterfaceRealization) {
                codeWriter.writeLine('\n// MARK: - Implementation for ' + elem.ownedElements[0].target.name);
                var methodList = cppCodeGen.classifyVisibility(elem.ownedElements[0].target.operations.slice(0));
                writeClassMethod(methodList);
            }
            
            codeWriter.writeLine("\n}\n");
        };

        var result = new $.Deferred(),
        self = this,
        fullPath,
        directory,
        file;

        // Package -> as namespace or not
        if (elem instanceof type.UMLPackage) {
            fullPath = path + "/" + elem.name;
            directory = FileSystem.getDirectoryForPath(fullPath);
            directory.create(function (err, stat) {
                if (!err || err === "AlreadyExists") {
                    Async.doSequentially(
                        elem.ownedElements,
                        function (child) {
                            return self.generate(child, fullPath, options);
                        },
                        false
                    ).then(result.resolve, result.reject);
                } else {
                    result.reject(err);
                }
            });

        } else if (elem instanceof type.UMLClass) {

//            // generate class header elem_name.h
//            file = FileSystem.getFileForPath(getFilePath(_CPP_CODE_GEN_H));
//            FileUtils.writeText(file, this.writeHeaderSkeletonCode(elem, options, writeClassHeader), true).then(result.resolve, result.reject);

            // generate class cpp elem_name.cpp
            if (options.genImpl) {
                file = FileSystem.getFileForPath(getFilePath(_CPP_CODE_GEN_CPP));
                FileUtils.writeText(file, this.writeBodySkeletonCode(elem, options, writeClassBody), true).then(result.resolve, result.reject);
            }

        } else if (elem instanceof type.UMLInterface) {
            /**
             * interface will convert to class which only contains virtual method and member variable.
             */
            // generate interface header ONLY elem_name.h
            file = FileSystem.getFileForPath(getFilePath(_CPP_CODE_GEN_CPP));
            FileUtils.writeText(file, this.writeHeaderSkeletonCode(elem, options, writeClassHeader), true).then(result.resolve, result.reject);

        } else if (elem instanceof type.UMLEnumeration) {
            // generate enumeration header ONLY elem_name.h

            file = FileSystem.getFileForPath(getFilePath(_CPP_CODE_GEN_CPP));
            FileUtils.writeText(file, this.writeHeaderSkeletonCode(elem, options, writeEnumeration), true).then(result.resolve, result.reject);
        } else {
            result.resolve();
        }
        return result.promise();
    };

    /**
     * Write *.h file. Implement functor to each uml type.
     * Returns text
     *
     * @param {Object} elem
     * @param {Object} options
     * @param {Object} functor
     * @return {Object} string
     */
    CppCodeGenerator.prototype.writeHeaderSkeletonCode = function (elem, options, funct) {
        var headerString = "_" + elem.name.toUpperCase() + "_H";
        var codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));
        var includePart = this.getIncludePart(elem);
        // codeWriter.writeLine(copyrightHeader);
        codeWriter.writeLine();

        if (includePart.length > 0) {
            codeWriter.writeLine(includePart);
            codeWriter.writeLine();
        }
        
        codeWriter.writeLine();
        //codeWriter.writeLine("import Foundation\n");
        
        funct(codeWriter, elem, this);
        
        return codeWriter.getData();
    };

    /**
     * Write *.cpp file. Implement functor to each uml type.
     * Returns text
     *
     * @param {Object} elem
     * @param {Object} options
     * @param {Object} functor
     * @return {Object} string
     */
    CppCodeGenerator.prototype.writeBodySkeletonCode = function (elem, options, funct) {
        var codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));

        codeWriter.writeLine(copyrightHeader);
        codeWriter.writeLine();
        //codeWriter.writeLine("#import \"" +  elem.name + ".h\"");
        codeWriter.writeLine("import Foundation\n");
        codeWriter.writeLine();
        funct(codeWriter, elem, this);
        return codeWriter.getData();
    };

    /**
     * Parsing template parameter
     *
     * @param {Object} elem
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getTemplateParameter = function (elem) {
        var i;
        var returnTemplateString = "";
        if (elem.templateParameters.length <= 0) {
            return returnTemplateString;
        }
        var term = [];
        returnTemplateString = "template<";

        for (i = 0; i < elem.templateParameters.length; i++) {
            var template = elem.templateParameters[i];
            var templateStr = template.parameterType + " ";
            templateStr += template.name + " ";
            if (template.defaultValue.length !== 0) {
                templateStr += " = " + template.defaultValue;
            }
            term.push(templateStr);
        }
        returnTemplateString += term.join(", ");
        returnTemplateString += ">";
        return returnTemplateString;
    };

    /**
     * Parsing include header
     *
     * @param {Object} elem
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getIncludePart = function (elem) {

        var i;
        var trackingHeader = function (elem, target) {
            var header = "";
            var elementString = "";
            var targetString = "";
            var i;


            while (elem._parent._parent !== null) {
                elementString = (elementString.length !== 0) ?  elem.name + "/" + elementString : elem.name;
                elem = elem._parent;
            }
            while (target._parent._parent !== null) {
                targetString = (targetString.length !== 0) ?  target.name + "/" + targetString : target.name;
                target = target._parent;
            }

            var idx;
            for (i = 0; i < (elementString.length < targetString.length) ? elementString.length : targetString.length; i++) {

                if (elementString[i] === targetString[i]) {
                    if (elementString[i] === '/' && targetString[i] === '/') {
                        idx = i + 1;
                    }
                } else {
                    break;
                }
            }
            // remove common path
            elementString = elementString.substring(idx, elementString.length);
            targetString = targetString.substring(idx, targetString.length);

            for (i = 0; i < elementString.split('/').length - 1; i++) {
                header += "../";
            }
            header += targetString;

            return header;
        };


        var headerString = "";
        if (Repository.getRelationshipsOf(elem).length <= 0) {
            return "";
        }
        var associations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });
        var realizations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLInterfaceRealization || rel instanceof type.UMLGeneralization);
        });

        // check for interface or class
        for (i = 0; i < realizations.length; i++) {
            var realize = realizations[i];
            if (realize.target === elem) {
                continue;
            }
            //headerString += "#import \"" + trackingHeader(elem, realize.target) + ".h\"\n";
        }

        // check for member variable
        for (i = 0; i < associations.length; i++) {
            var asso = associations[i];
            var target;
            if (asso.end1.reference === elem && asso.end2.navigable === true && asso.end2.name.length !== 0) {
                target = asso.end2.reference;
            } else if (asso.end2.reference === elem && asso.end1.navigable === true && asso.end1.name.length !== 0) {
                target = asso.end1.reference;
            } else {
                continue;
            }
            if (target === elem) {
                continue;
            }
            //headerString += "#import \"" + trackingHeader(elem, target) + ".h\"\n";
        }

        return headerString;
    };

    /**
     * Classfy method and attribute by accessor.(public, private, protected)
     *
     * @param {Object} items
     * @return {Object} list
     */
    CppCodeGenerator.prototype.classifyVisibility = function (items) {
        var public_list = [];
        var protected_list = [];
        var private_list = [];
        var i;
        for (i = 0; i < items.length; i++) {

            var item = items[i];
            var visib = this.getVisibility(item);

            if ("public" === visib) {
                public_list.push(item);
            } else if ("private" === visib) {
                private_list.push(item);
            } else {
                // if modifier not setted, consider it as protected
                protected_list.push(item);
            }
        }
        return {
            _public : public_list,
            _protected: protected_list,
            _private: private_list
        };
    };

    /**
     * generate variables from attributes[i]
     *
     * @param {Object} elem
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getMemberVariable = function (elem, isProtocol) {
        if (elem.name.length > 0) {
            var terms = [];
            // doc
            var indentLine = "";
            var i;
            for (i = 0; i < this.genOptions.indentSpaces; i++) {
                indentLine += " ";
            }
            var docs = "";
            if (elem.documentation) {
                var doc = '' + (elem.documentation ? elem.documentation : elem.name) + "\n";
                docs = this.getIndentDocuments(doc, indentLine);
            }
            var property = indentLine;
            if (elem.type instanceof type.UMLClass) {
                property += this.getVisibility(elem) + " "
            }
            property += "var ";
            // type
            var _type = this.getType(elem);
            
            if (_type.indexOf('') === -1) {
                property += "";
            } else {
                property += "";
            }
            
            if (elem.type instanceof type.UMLInterface) {
                //_type = "id<" + _type + ">";
                _type = "" + _type + "";
            }
            if (_type === "void") {
                if (isProtocol) {
                    property += elem.name + ": String? {get}";
                } else {
                    property += elem.name + ": String?";
                }
                
            } else if (_type === "Dictionary" || _type === "dictionary") {
                if (isProtocol) {
                    property += elem.name + ": Dictionary<String, Any> {get}";
                } else {
                    property += elem.name + ": Dictionary<String, Any>?";
                }
                
            } else if (_type === "Array" || _type === "array") {
                if (isProtocol) {
                    property += elem.name + ": Array<Any> {get}";
                } else {
                    property += elem.name + ": Array<Any>?";
                }
                
            } else {
                if (isProtocol) {
                    property += elem.name + ": " + _type + " {get}";
                } else {
                    property += elem.name + ": " + _type + "?";
                }
            }
            
            //return (doc + property);
            return (docs + property);
        }
    };

    /**
     * generate methods from operations[i]
     *
     * @param {Object} elem
     * @param {boolean} isCppBody
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getMethod = function (elem, isCppBody) {
        if (elem.name.length > 0) {
            var docs = "@brief " + (elem.documentation ? elem.documentation : elem.name);
            var i;
            var methodStr = "    ";
            var isVirtaul = false;
            // TODO virtual fianl static 키워드는 섞어 쓸수가 없다
            if (elem.isStatic === true) {
                methodStr += "static ";
            }
            methodStr += "func ";

            var returnTypeParam = _.filter(elem.parameters, function (params) {
                return params.direction === "return";
            });
            var inputParams = _.filter(elem.parameters, function (params) {
                return params.direction === "in";
            });
            var inputParamStrings = [];
            for (i = 0; i < inputParams.length; i++) {
                var inputParam = inputParams[i];
                inputParamStrings.push(this.getType(inputParam) ? this.getType(inputParam) : '');
                inputParamStrings.push(inputParam.name ? inputParam.name : '');
                docs += "\n@param " + inputParam.name + ' ' + ((inputParam.documentation) ? inputParam.documentation : '');
            }
            if (returnTypeParam.length > 0) {
                var tmpReturnType = this.getType(returnTypeParam[0]);
                docs += "\n@return " + (returnTypeParam[0].documentation ? returnTypeParam[0].documentation : tmpReturnType);
                //methodStr += "(" + this.getType(returnTypeParam[0]) + ")";
            } else {
                //methodStr += "(void)";
            }

            var splitParamsFunc = function (params) {
                var firstUpperCase = function (str) {
                    return str.replace(/\b(\w)(\w*)/g, function ($0, $1, $2) {
                        return $1.toUpperCase() + $2;
                    });
                };
                var str = "";
                for (i = 0; i < params.length; i = i + 2) {
                    var ptype = params[i];
                    var pvalue = params[i + 1];
                    var keywordSignatures = pvalue + ': ' + ptype;
                    if (i === 0) {
                        str += keywordSignatures;
                        continue;
                    }
                    str += ", " + keywordSignatures;
                }
                
                return str.replace(/(^\s*)|(\s*$)/g, '');
            };
            

            var indentLine = "";

            for (i = 0; i < this.genOptions.indentSpaces; i++) {
                indentLine += " ";
            }
            if (isCppBody) {
                var t_elem = elem;
                var specifier = "";

                while (t_elem._parent instanceof type.UMLClass) {
                    specifier = specifier;
                    t_elem = t_elem._parent;
                }

                methodStr += specifier;
                methodStr += elem.name;
                methodStr += "(";
                methodStr += splitParamsFunc(inputParamStrings) + "";
                methodStr += ")";
                
                if (returnTypeParam.length > 0) {
                    var tmpReturnType = this.getType(returnTypeParam[0]);
                    if (tmpReturnType === "void"){
                        methodStr += "";
                    } else {
                        methodStr += " -> " + this.getType(returnTypeParam[0]) + "";
                    }
                } else {
                    methodStr += "";
                }
                
                methodStr += " {\n";
                
                if (elem.isAbstract === true && this.genOptions.genStrictAbstract) {
                    methodStr += '\n' + indentLine + "// AbstractMethodNotImplemented";
                }
                if (returnTypeParam.length > 0) {
                    var returnType = this.getType(returnTypeParam[0]);
                    if (returnType === "boolean" || returnType === "bool" || returnType === "BOOL" || returnType === "Bool") {
                        methodStr += '\n' + indentLine + indentLine + "return false";
                    } else if (returnType === "int" || returnType === "long" || returnType === "short" || returnType === "byte" || returnType === "NSInteger") {
                        methodStr += '\n' + indentLine + indentLine + "return 0";
                    } else if (returnType === "double" || returnType === "float" || returnType === "CGFloat") {
                        methodStr += '\n' + indentLine + indentLine + "return 0.0";
                    } else if (returnType === "char") {
                        methodStr += '\n' + indentLine + indentLine + "return '0'";
                    } else if (returnType === "string" || returnType === "String" || returnType === "NSString *") {
                        methodStr += '\n' + indentLine + indentLine + 'return ""';
                    } else if (returnType === "void") {
                        //methodStr += '\n' + indentLine + indentLine + "return";
                    } else {
                        methodStr += '\n' + indentLine + indentLine + "return " + returnType +".init()";
                    }
                }
                methodStr += "\n    }";
            } else {
                methodStr += elem.name;
                methodStr += "(";
                
                methodStr += splitParamsFunc(inputParamStrings);

                methodStr += ")";
            }

//            if (isCppBody) {
//                return "\n" + methodStr;
//            }
            return "\n" + this.getIndentDocuments(docs, indentLine) + methodStr;
        }
    };

    /**
     * generate doc string from doc element
     *
     * @param {Object} text
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getDocuments = function (text) {
        var docs = "";
        if (_.isString(text) && text.length !== 0) {
            var lines = text.trim().split("\n");
            docs += "/**\n";
            var i;
            for (i = 0; i < lines.length; i++) {
                docs += " * " + lines[i] + "\n";
            }
            docs += " */\n";
        }
        return docs;
    };
    CppCodeGenerator.prototype.getIndentDocuments = function (text, indentLine) {
        var docs = "";
        if (_.isString(text) && text.length !== 0) {
            var lines = text.trim().split("\n");
            docs += indentLine + "/**\n";
            var i;
            for (i = 0; i < lines.length; i++) {
                docs += indentLine + " * " + lines[i] + "\n";
            }
            docs += indentLine + " */\n";
        }
        return docs;
    };

    /**
     * parsing visibility from element
     *
     * @param {Object} elem
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getVisibility = function (elem) {
        switch (elem.visibility) {
        case UML.VK_PUBLIC:
            return "public";
        case UML.VK_PROTECTED:
            return "fileprivate";
        case UML.VK_PRIVATE:
            return "private";
        }
        return "";
    };

    /**
     * parsing modifiers from element
     *
     * @param {Object} elem
     * @return {Object} list
     */
    CppCodeGenerator.prototype.getModifiers = function (elem) {
        var modifiers = [];

        if (elem.isStatic === true) {
            modifiers.push("static");
        }
        if (elem.isReadOnly === true) {
            modifiers.push("const");
        }
        if (elem.isAbstract === true) {
            modifiers.push("virtual");
        }
        return modifiers;
    };

    /**
     * parsing type from element
     *
     * @param {Object} elem
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getType = function (elem) {
        var _type = "void";

        if (elem instanceof type.UMLAssociationEnd) { // member variable from association
            if (elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0) {
                _type = elem.reference.name;
            }
        } else { // member variable inside class
            if (elem.type instanceof type.UMLModelElement && elem.type.name.length > 0) {
                _type = elem.type.name;
            } else if (_.isString(elem.type) && elem.type.length > 0) {
                _type = elem.type;
            }
        }

        // multiplicity
        if (elem.multiplicity) {
            if (_.contains(["0..*", "1..*", "*"], elem.multiplicity.trim())) {
                if (elem.isOrdered === true) {
                    _type = "Vector<" + _type + ">";
                } else {
                    _type = "Vector<" + _type + ">";
                }
            } else if (elem.multiplicity !== "1" && elem.multiplicity.match(/^\d+$/)) { // number
                //TODO check here
                _type += "[]";
            }
        }
        return this.renameType(_type);
    };

    /**
     * get all super class / interface from element
     *
     * @param {Object} elem
     * @return {Object} list
     */
    CppCodeGenerator.prototype.getSuperClasses = function (elem) {
        var generalizations = Repository.getRelationshipsOf(elem, function (rel) {
            return ((rel instanceof type.UMLGeneralization || rel instanceof type.UMLInterfaceRealization) && rel.source === elem);
        });
        return generalizations;
    };
    
    CppCodeGenerator.prototype.renameType = function (type) {
        switch (type) {
            case "String":
                return "String";
            case "string":
                return "String";
            case "Integer":
                return "Int";
            case "long":
                return "Int64";
            case "short":
                return "Int8";
            case "boolean":
                return "Bool";
            case "bool":
                return "Bool";
            case "float":
                return "Float";
            case "int":
                return "Int";
            case "byte":
                return "Byte";
            case "Object":
                return "AnyObject";
            case "id":
                return "AnyObject";
            default:
                break;
        }
        return type;
    };

    function generate(baseModel, basePath, options) {
        var result = new $.Deferred();
        var cppCodeGenerator = new CppCodeGenerator(baseModel, basePath);
        return cppCodeGenerator.generate(baseModel, basePath, options);
    }

    function getVersion() {return versionString; }

    exports.generate = generate;
    exports.getVersion = getVersion;
});
