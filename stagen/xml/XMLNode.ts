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

// import {
//     Iterator,
//     DictionaryIterator
// } from '@breautek/iterator';

// export class XMLNode {
//     private _tagName: string;
//     private _attributes: Record<string, string>;
//     private _value: string;
//     private _parent: XMLNode;
//     private _children: Array<XMLNode>;

//     public constructor(tagName: string, attributes?: Record<string, string>) {
//         this._tagName = tagName;
//         this._attributes = attributes || {};
//         this._value = '';

//         this._children = [];
//         this._parent = null;
//     }

//     public getTagName(): string {
//         return this._tagName;
//     }

//     public setValue(value: string): void {
//         this._value = value;
//     }

//     public getValue(): string {
//         return this._value;
//     }

//     public hasValue(): boolean {
//         return !!this._value;
//     }

//     public setAttribute(key: string, value: string): void {
//         this._attributes[key] = JSON.stringify(value);
//     }

//     public getAttribute(key: string): string {
//         return this._attributes[key];
//     }

//     public hasAttribute(key: string): boolean {
//         return !!this._attributes[key];
//     }

//     public removeAttribute(key: string): void {
//         delete this._attributes[key];
//     }

//     public attributeCount(): number {
//         return Object.keys(this._attributes).length;
//     }

//     public childCount(): number {
//         return this._children.length;
//     }

//     public appendChild(node: XMLNode): void {
//         if (this.isChild(node)) {
//             this.removeChild(node);
//         }

//         if (node.hasParent()) {
//             node.getParent().removeChild(node);
//         }

//         node._setParent(this);

//         this._children.push(node);
//     }

//     public isChild(node: XMLNode): boolean {
//         return this._children.indexOf(node) > -1;
//     }

//     public removeChild(node: XMLNode): void {
//         if (this.isChild(node)) {
//             this._children.splice(this.indexOf(node), 1);
//         }
//     }

//     public indexOf(node: XMLNode): number {
//         return this._children.indexOf(node);
//     }

//     public hasParent(): boolean {
//         return !!this._parent;
//     }

//     public getParent(): XMLNode {
//         return this._parent;
//     }

//     public iterator(): Iterator<XMLNode> {
//         return new Iterator<XMLNode>(this._children);
//     }

//     public attributeIterator(): DictionaryIterator<Record<string, string>> {
//         return new DictionaryIterator(this._attributes);
//     }

//     private _setParent(parent: XMLNode): void {
//         this._parent = parent;
//     }
// }
