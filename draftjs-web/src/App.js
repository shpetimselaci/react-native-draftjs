import React, { useState, createRef, useEffect } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  DefaultDraftBlockRenderMap,
  convertFromRaw,
  convertToRaw
} from "draft-js";
import { Map } from "immutable";
import EditorController from "./Components/EditorController/EditorController";

/**
 * For testing the post messages
 * in web
 */
// window.ReactNativeWebView ={};
// window.ReactNativeWebView.postMessage = value => console.log(value);

function App() {
  const _draftEditorRef = createRef();
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [placeholder, setPlaceholder] = useState("");
  const [editorStyle, setEditorStyle] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [styleMap, setStyleMap] = useState({});
  const [blockRenderMap, setBlockRenderMap] = useState(Map({}));
  const [isMounted, setMountStatus] = useState(false);

  useEffect(() => {
    if (!isMounted) {
      setMountStatus(true);
      /**
       * componentDidMount action goes here...
       */
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            isMounted: true
          })
        );
      }
    }
  }, [isMounted]);

  const handleKeyCommand = (command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      return true;
    }
    return false;
  };

  const mapKeyToEditorCommand = e => {
    switch (e.keyCode) {
      case 9: // TAB
        const newEditorState = RichUtils.onTab(
          e,
          editorState,
          4 /* maxDepth */
        );
        if (newEditorState !== editorState) {
          setEditorState(newEditorState);
        }
        return;
      case 13:
        window.scrollBy({
          top: 18,
          behavior: 'smooth',
        });
      default:
        return getDefaultKeyBinding(e);
    }
  };
  const toggleBlockType = blockType => {
    setEditorState(prevEditorState => RichUtils.toggleBlockType(prevEditorState, blockType));
  };

  const toggleInlineStyle = inlineStyle => {
    setEditorState(prevEditorState => RichUtils.toggleInlineStyle(prevEditorState, inlineStyle));
  };

  useEffect(() => {
    window.toggleBlockType = toggleBlockType;
    window.toggleInlineStyle =toggleInlineStyle;
    window.setDefaultValue = raw => {
      try {
        if (raw) {
          setEditorState(EditorState.createWithContent(convertFromRaw(raw)));
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.setEditorPlaceholder = setPlaceholder;
    window.setEditorStyleSheet = setEditorStyle;
    window.setEditorStyleMap = setStyleMap;
    window.focusTextEditor = () => {
      _draftEditorRef.current && _draftEditorRef.current.focus();
    };
    window.blurTextEditor =  () => {
      _draftEditorRef.current && _draftEditorRef.current.blur();
    };
    window.setEditorBlockRenderMap = renderMapString => {
      try {
        setBlockRenderMap(Map(JSON.parse(renderMapString)));
      } catch (e) {
        setBlockRenderMap(Map({}));
        console.error(e);
      }
    };
    window.setReadOnly = (bool) => {
      try {
        setReadOnly(JSON.parse(bool));
      } catch (err) {
        //
      }
    };
  }, [])


  const customBlockRenderMap = DefaultDraftBlockRenderMap.merge(blockRenderMap);
  const postState = (newState) => new Promise((resolve) => {
    if(window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          editorState: convertToRaw(newState.getCurrentContent()),
        })
      );
      resolve();
    }
    });
  return (
    <>
      <style>
        {`.public-DraftEditorPlaceholder-root{position: absolute;color: silver;pointer-events: none;z-index: -10000;}${editorStyle}`}
      </style>
      <Editor
        ref={_draftEditorRef}
        customStyleMap={styleMap}
        blockRenderMap={customBlockRenderMap}
        editorState={editorState}
        onChange={(newState) => {postState(newState); setEditorState(newState)}}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={mapKeyToEditorCommand}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      <EditorController
        editorState={editorState}
        onToggleBlockType={toggleBlockType}
        onToggleInlineStyle={toggleInlineStyle}
      />
    </>
  );
}

export default App;
