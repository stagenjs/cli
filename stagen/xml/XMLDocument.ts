/*
Copyright [2021] [Norman Breau]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// import {XMLNode} from './XMLNode';
// import {XMLComment} from './XMLComment';
// import {
//     DictionaryIterator,
//     IDictionaryIteratorResult,
//     Iterator
// } from '@breautek/iterator';

// export class XMLDocument {
//     private _xmlVersion: string;
//     private _encoding: string;
//     private _root: XMLNode;

//     public constructor(xmlVersion?: string, encoding?: string) {
//         this._xmlVersion = xmlVersion || '1.0';
//         this._encoding = encoding || 'utf-8';
//         this._root = null;
//     }

//     public setRoot(node: XMLNode): void {
//         this._root = node;
//     }

//     public serialize(includeProcessingInstruction?: boolean, pretty?: boolean): string {
//         let data = '';

//         if (includeProcessingInstruction) {
//             data = `<?xml version="${this._xmlVersion}" encoding="${this._encoding}"?>\n`;
//         }

//         if (!this._root) {
//             return data;
//         }

//         data += this._serializeNode(this._root, 0, pretty);

//         return data;
//     }

//     public deserialize(xmlString: string): XMLDocument {
//         throw new Error('Not Implemented yet. Looks like we have work to do :-)');
//         // return new XMLDocument();
//     }

//     private _serializeNode(node: XMLNode, tabCount: number, pretty: boolean): string {
//         if (!tabCount) {
//             tabCount = 0;
//         }

//         let n: string = '\n';

//         if (!pretty) {
//             tabCount = 0;
//             n = '';
//         }

//         let tabs: string = '';
//         for (let i: number = 0; i < tabCount; i++) {
//             tabs += '\t';
//         }

//         let data: string = '';
//         let tagName = node.getTagName();
//         let attributeIterator: DictionaryIterator<Record<string, string>> = node.attributeIterator();
//         let childIterator: Iterator<XMLNode> = node.iterator();

//         if (node instanceof XMLComment) {
//             data += `${tabs}<!-- ${node.getValue()} -->${n}`;
//         }
//         else {
//             let oTag: string;
//             if (attributeIterator.hasNext()) {
//                 oTag = `<${tagName}`;
//                 while (attributeIterator.hasNext()) {
//                     let attribute: IDictionaryIteratorResult<Record<string, string>> = attributeIterator.next();
//                     oTag += ` ${attribute.key}="${attribute.value}"`;
//                 }

//                 if (node.childCount() > 0) {
//                     oTag += `>${n}`;
//                 }
//                 else {
//                     oTag += ` />${n}`;
//                 }
//             }
//             else {
//                 if (node.childCount() > 0 || node.hasValue()) {
//                     oTag = `<${tagName}>`;
//                 }
//                 else {
//                     oTag = `<${tagName} />${n}`;
//                 }
//             }

//             data += tabs + oTag;

//             if (node.hasValue()) {
//                 data += node.getValue();
//             }
//             else {
//                 data += n;
//             }

//             while (childIterator.hasNext()) {
//                 data += this._serializeNode(childIterator.next(), tabCount + 1, pretty);
//             }

//             if (node.childCount() > 0 || node.hasValue()) {
//                 if (node.hasValue()) {
//                     data += `</${tagName}>`;
//                 }
//                 else {
//                     data += `${tabs}</${tagName}>`;
//                 }
//                 data += n;
//             }
//         }

//         return data;
//     }
// }
