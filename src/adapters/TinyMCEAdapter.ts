/*
 *
 * * Copyright 2015 Acrolinx GmbH
 * *
 * * Licensed under the Apache License, Version 2.0 (the "License");
 * * you may not use this file except in compliance with the License.
 * * You may obtain a copy of the License at
 * *
 * * http://www.apache.org/licenses/LICENSE-2.0
 * *
 * * Unless required by applicable law or agreed to in writing, software
 * * distributed under the License is distributed on an "AS IS" BASIS,
 * * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * * See the License for the specific language governing permissions and
 * * limitations under the License.
 * *
 * * For more information visit: http://www.acrolinx.com
 *
 */

namespace acrolinx.plugins.adapter {
  'use strict';

  import AcrSelectionUtils = acrolinx.plugins.utils.selection;

  export class TinyMCEAdapter implements AdapterInterface {

    config:any;
    editorId:any;
    editor:any;
    html:any;
    isCheckingNow:any;
    currentHtmlChecking:any;
    prevCheckedHtml:any;

    constructor(conf) {
      this.config = conf;
      this.editorId = conf.editorId;
      this.editor = null;
    }

    getEditor() {
      if (this.editor === null) {
        this.editor = tinymce.get(this.editorId);
      }
      return this.editor;
    }

    getHTML() {
      return this.getEditor().getContent();
    }

    getEditorDocument() {
      try {
        return this.getEditor().contentDocument;
      } catch (error) {
        throw error;
      }
    }

    getCurrentText() {
      try {
        return rangy.innerText(this.getEditorDocument());
      } catch (error) {
        throw error;
      }
    }

    selectText(begin, length) {
      var doc = this.getEditorDocument();
      var selection = rangy.getSelection(doc);
      var range = rangy.createRange(doc);

      range.moveStart('character', begin);
      range.moveEnd('character', length);
      selection.setSingleRange(range);
      return range;
    }

    scrollIntoView2(sel) {
      var range = sel.getRng();
      var tmp = range.cloneRange();
      tmp.collapse();

      var text = document.createElement('span');
      tmp.startContainer.parentNode.insertBefore(text, tmp.startContainer);
      text.scrollIntoView();
      text.remove();
    }

    scrollAndSelect(matches) {
      var newBegin, matchLength, selection1, range1, range2,

        newBegin = matches[0].foundOffset;
      matchLength = matches[0].flagLength + 1;
      range1 = this.selectText(newBegin, matchLength);
      selection1 = this.getEditor().selection;

      if (selection1) {
        try {
          //selection1.scrollIntoView();
          this.scrollIntoView2(selection1);
          //Special hack for WordPress TinyMCE
          var wpContainer = acrolinxLibs.$('#wp-content-editor-container');
          if (wpContainer.length > 0) {
            wpContainer.get(0).scrollIntoView();
          }
        } catch (error) {
          console.log("Scrolling Error!");
        }
      }
      //
      // scrollIntoView need to set it again
      range2 = this.selectText(newBegin, matchLength);
    }

    extractHTMLForCheck() {
      //var checkCallResult,
      //  startTime = new Date().getTime();

      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      return {html: this.html};
    }

    registerCheckCall(checkInfo) {

    }


    registerCheckResult(checkResult) {
      this.isCheckingNow = false;
      this.currentHtmlChecking = this.html;
      this.prevCheckedHtml = this.currentHtmlChecking;
      return [];
    }

    selectRanges(checkId, matches) {
      this.selectMatches(checkId, matches);
    }

    selectMatches(checkId, matches) {
      var rangyFlagOffsets,
        index,
        offset;

      var rangyText = this.getCurrentText();

      matches = AcrSelectionUtils.addPropertiesToMatches(matches, this.currentHtmlChecking);

      rangyFlagOffsets = AcrSelectionUtils.findAllFlagOffsets(rangyText, matches[0].searchPattern);
      index = AcrSelectionUtils.findBestMatchOffset(rangyFlagOffsets, matches);

      offset = rangyFlagOffsets[index];
      matches[0].foundOffset = offset;

      //Remove escaped backslash in the text content. Escaped backslash can only present
      //for multiple punctuation cases. For long sentence, backslashes may present which
      //must not be removed as they are part of the original text
      if (matches[0].content.length >= matches[0].range[1] - matches[0].range[0]) {
        matches[0].textContent = matches[0].textContent.replace(/\\/g, '');
      } else {
        matches[0].textContent = matches[0].textContent.replace(/\\\\/g, '\\');
      }
      matches[0].flagLength = matches[0].textContent.length - 1;

      if (offset >= 0) {
        this.scrollAndSelect(matches);
      } else {
        throw 'Selected flagged content is modified.';
      }
    }

    replaceRanges(checkId, matchesWithReplacement) {
      var replacementText,
        selectionFromCharPos = 1;

      try {
        // this is the selection on which replacement happens
        this.selectMatches(checkId, matchesWithReplacement);

        if (matchesWithReplacement[0].foundOffset + matchesWithReplacement[0].flagLength < this.getCurrentText().length) {
          matchesWithReplacement[0].foundOffset += selectionFromCharPos;
          matchesWithReplacement[0].flagLength -= selectionFromCharPos;
        }

        // Select the replacement, as replacement of selected flag will be done
        this.scrollAndSelect(matchesWithReplacement);
      } catch (error) {
        console.log(error);
        throw error;
      }

      // Replace the selected text
      replacementText = acrolinxLibs._.map(matchesWithReplacement, 'replacement').join('');
      this.editor.selection.setContent(replacementText);

      if ((matchesWithReplacement[0].foundOffset + matchesWithReplacement[0].flagLength) < this.getCurrentText().length) {
        if (selectionFromCharPos > 0) {
          // Select & delete characters which were not replaced above
          this.selectText(matchesWithReplacement[0].foundOffset - selectionFromCharPos, selectionFromCharPos);
          rangy.getSelection(this.getEditorDocument()).nativeSelection.deleteFromDocument();
        }
        matchesWithReplacement[0].foundOffset -= selectionFromCharPos;
        matchesWithReplacement[0].flagLength += selectionFromCharPos;
      }

      // Select the replaced flag
      this.selectText(matchesWithReplacement[0].foundOffset, replacementText.length);
    }
  }
}
