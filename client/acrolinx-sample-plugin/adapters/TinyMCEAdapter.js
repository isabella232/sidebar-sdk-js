/**
 * Created by pricope on 9/7/2015.
 */
'use strict';
var TinyMCEAdapter = (function () {
  var cls = function (conf) {
    this.config = conf;

    var oldThis = this;
    tinymce.PluginManager.add('acrolinx', function (editor,url) {
      oldThis.editor = editor;
    });
  };


  var onMceInit = function (editor, url) {
    this.editor = editor;
    this.url = url;
    console.log("Editor init:", editor, url);
  };

  cls.prototype = {
    getEditor: function () {
      return this.editor;
    },

    getHTML: function () {
      return this.getEditor().getContent();
    },

    getEditorDocument: function () {
      try {
        return this.editor.contentDocument;
      } catch (error) {
        throw error;
      }
    },

    getCurrentText: function () {
      try {
        return rangy.innerText(this.getEditorDocument());
      } catch (error) {
        throw error;
      }
    },

    selectText: function (begin, length) {
      var doc = this.getEditorDocument();
      var selection = rangy.getSelection(doc);
      var range = rangy.createRange(doc);

      range.moveStart('character', begin);
      range.moveEnd('character', length);
      selection.setSingleRange(range);
      return range;
    },

    scrollIntoView2: function (sel) {
      var range = sel.getRng();
      var tmp = range.cloneRange();
      tmp.collapse();

      var text = document.createElement('span');
      tmp.startContainer.parentNode.insertBefore(text, tmp.startContainer);
      text.scrollIntoView();
      text.remove();

      //var content = sel.getContent();
      //sel.setContent("<span id='acrolinx_hack'>&nbsp;</span>" + content);
      //var ref = $(getEditor().getBody()).find('#acrolinx_hack').get(0);
      //ref.scrollIntoView();
      //ref.remove();

    },

    scrollAndSelect: function (matches) {
      var newBegin,
        matchLength,
        selection1,
        selection2,
        range1,
        range2,
        doc;

      newBegin = matches[0].foundOffset;
      matchLength = matches[0].flagLength + 1;
      range1 = this.selectText(newBegin, matchLength);
      //$(getEditor().getBody()).find('em').get(0).scrollIntoView();
      selection1 = this.getEditor().selection;

      if (selection1) {
        try {
          //selection1.scrollIntoView();
          this.scrollIntoView2(selection1);
          //Special hack for WordPress TinyMCE
          var wpContainer = $('#wp-content-editor-container');
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
    },

    extractHTMLForCheck: function () {
      //var checkCallResult,
      //  startTime = new Date().getTime();

      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      return {html: this.html};
    },

    registerCheckCall: function (checkInfo) {

    },


    registerCheckResult: function (checkResult) {
      this.isCheckingNow = false;
      this.currentHtmlChecking = this.html;
      this.prevCheckedHtml = this.currentHtmlChecking;
      return [];
    },

    selectRanges:function (checkId, matches) {
      this.selectMatches(checkId, matches);
    },

    selectMatches:function (checkId, matches) {
      var rangyFlagOffsets,
        index,
        offset;

      var rangyText = this.getCurrentText();

      matches = AcrSelectionUtils.addPropertiesToMatches(matches,this.currentHtmlChecking);

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
    },

    replaceRanges:function (checkId, matchesWithReplacement) {
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
        return;
      }

      // Replace the selected text
      replacementText = _.map(matchesWithReplacement, 'replacement').join('');
      //editor.insertText(replacementText);
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

    },




  };

  return cls;

})();