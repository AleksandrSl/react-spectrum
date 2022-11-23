/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {announce} from '@react-aria/live-announcer';
import {AriaCommandPaletteProps} from '@react-types/commandpalette';
import {AriaListBoxOptions, getItemId, listData} from '@react-aria/listbox';
import {BaseEvent, KeyboardDelegate} from '@react-types/shared';
import {chain, isAppleDevice, mergeProps, useLabels, useLayoutEffect} from '@react-aria/utils';
import {CommandPaletteState} from '@react-stately/commandpalette';
import {FocusEvent, InputHTMLAttributes, KeyboardEvent, RefObject, TouchEvent, useEffect, useMemo, useRef} from 'react';
import {getItemCount} from '@react-stately/collections';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {ListKeyboardDelegate, useSelectableCollection} from '@react-aria/selection';
import {useLocalizedStringFormatter} from '@react-aria/i18n';
import {useMenuTrigger} from '@react-aria/menu';
import {useTextField} from '@react-aria/textfield';

export interface AriaCommandPaletteOptions<T> extends AriaCommandPaletteProps<T> {
  /** The ref for the input element. */
  inputRef: RefObject<HTMLInputElement>,
  /** The ref for the list box popover. */
  popoverRef: RefObject<Element>,
  /** The ref for the list box. */
  listBoxRef: RefObject<HTMLElement>,
  /** The ref for the optional list box popup trigger button.  */
  buttonRef?: RefObject<Element>,
  /** An optional keyboard delegate implementation, to override the default. */
  keyboardDelegate?: KeyboardDelegate
}

export interface CommandPaletteAria<T> {
  /** Props for the command palette input element. */
  inputProps: InputHTMLAttributes<HTMLInputElement>,
  /** Props for the list box, to be passed to [useListBox](useListBox.html). */
  listBoxProps: AriaListBoxOptions<T>
}

let hasSetupGlobalListener = false;

/**
 * Provides the behavior and accessibility implementation for a command palette component.
 * A command palette combines a text input with a listbox, allowing users to filter a list of options to items matching a query.
 * @param props - Props for the command palette.
 * @param state - State for the select, as returned by `useCommandPaletteState`.
 */
export function useCommandPalette<T>(props: AriaCommandPaletteOptions<T>, state: CommandPaletteState<T>): CommandPaletteAria<T> {
  let {
    buttonRef,
    inputRef,
    listBoxRef,
    keyboardDelegate
  } = props;

  useLayoutEffect(() => {
    setup();

    return () => {
      teardown();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function keyDownHandler(e) {
    if (e.key === 'k' && e.metaKey) {
      e.preventDefault();
      state.toggle();
    }
  }

  function setup() {
    if (hasSetupGlobalListener) {
      return;
    }
    document.addEventListener('keydown', keyDownHandler, true);
    hasSetupGlobalListener = true;
  }

  function teardown() {
    document.removeEventListener('keydown', keyDownHandler, true);
    hasSetupGlobalListener = false;
  }

  let stringFormatter = useLocalizedStringFormatter(intlMessages);
  let {menuTriggerProps, menuProps} = useMenuTrigger<T>(
    {
      type: 'listbox'
    },
    state,
    buttonRef
  );

  // Set listbox id so it can be used when calling getItemId later
  listData.set(state, {id: menuProps.id});

  // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
  // When virtualized, the layout object will be passed in as a prop and override this.
  let delegate = useMemo(() =>
    keyboardDelegate ||
    new ListKeyboardDelegate(state.collection, state.disabledKeys, listBoxRef)
  , [keyboardDelegate, state.collection, state.disabledKeys, listBoxRef]);

  // Use useSelectableCollection to get the keyboard handlers to apply to the textfield
  let {collectionProps} = useSelectableCollection({
    selectionManager: state.selectionManager,
    keyboardDelegate: delegate,
    disallowTypeAhead: true,
    disallowEmptySelection: true,
    shouldFocusWrap: true,
    ref: inputRef,
    // Prevent item scroll behavior from being applied here, should be handled in the user's Popover + ListBox component
    isVirtualized: true
  });

  // For textfield specific keydown operations
  let onKeyDown = (e: BaseEvent<KeyboardEvent<any>>) => {
    if (e.key === 'Escape') {
      state.close();
    } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      state.close();
    } else if (e.key === 'Enter') {
      let focused = state.selectionManager.focusedKey;
      state.setSelectedKey(focused);
      state.close();
    }
  };

  let onFocus = (e: FocusEvent) => {
    if (state.isFocused) {
      return;
    }

    if (props.onFocus) {
      props.onFocus(e);
    }

    state.setFocused(true);
  };

  let {inputProps} = useTextField({
    ...props,
    onChange: state.setInputValue,
    onKeyDown: chain(state.isOpen && collectionProps.onKeyDown, onKeyDown, props.onKeyDown),
    value: state.inputValue,
    onFocus,
    autoComplete: 'off'
  }, inputRef);

  let listBoxProps = useLabels({
    id: menuProps.id,
    'aria-label': stringFormatter.format('listboxLabel'),
    'aria-labelledby': props['aria-labelledby']
  });

  // VoiceOver has issues with announcing aria-activedescendant properly on change
  // (especially on iOS). We use a live region announcer to announce focus changes
  // manually. In addition, section titles are announced when navigating into a new section.
  let focusedItem = state.selectionManager.focusedKey != null && state.isOpen
    ? state.collection.getItem(state.selectionManager.focusedKey)
    : undefined;
  let sectionKey = focusedItem?.parentKey ?? null;
  let itemKey = state.selectionManager.focusedKey ?? null;
  let lastSection = useRef(sectionKey);
  let lastItem = useRef(itemKey);
  useEffect(() => {
    if (isAppleDevice() && focusedItem != null && itemKey !== lastItem.current) {
      let isSelected = state.selectionManager.isSelected(itemKey);
      let section = sectionKey != null ? state.collection.getItem(sectionKey) : null;
      let sectionTitle = section?.['aria-label'] || (typeof section?.rendered === 'string' ? section.rendered : '') || '';

      let announcement = stringFormatter.format('focusAnnouncement', {
        isGroupChange: section && sectionKey !== lastSection.current,
        groupTitle: sectionTitle,
        groupCount: section ? [...section.childNodes].length : 0,
        optionText: focusedItem['aria-label'] || focusedItem.textValue || '',
        isSelected
      });

      announce(announcement);
    }

    lastSection.current = sectionKey;
    lastItem.current = itemKey;
  });

  // Announce the number of available suggestions when it changes
  let optionCount = getItemCount(state.collection);
  let lastSize = useRef(optionCount);
  let lastOpen = useRef(state.isOpen);
  useEffect(() => {
    // Only announce the number of options available when the menu opens if there is no
    // focused item, otherwise screen readers will typically read e.g. "1 of 6".
    // The exception is VoiceOver since this isn't included in the message above.
    let didOpenWithoutFocusedItem =
      state.isOpen !== lastOpen.current &&
      (state.selectionManager.focusedKey == null || isAppleDevice());

    if (state.isOpen && (didOpenWithoutFocusedItem || optionCount !== lastSize.current)) {
      let announcement = stringFormatter.format('countAnnouncement', {optionCount});
      announce(announcement);
    }

    lastSize.current = optionCount;
    lastOpen.current = state.isOpen;
  });

  // Announce when a selection occurs for VoiceOver. Other screen readers typically do this automatically.
  let lastSelectedKey = useRef(state.selectedKey);
  useEffect(() => {
    if (isAppleDevice() && state.isFocused && state.selectedItem && state.selectedKey !== lastSelectedKey.current) {
      let optionText = state.selectedItem['aria-label'] || state.selectedItem.textValue || '';
      let announcement = stringFormatter.format('selectedAnnouncement', {optionText});
      announce(announcement);
    }

    lastSelectedKey.current = state.selectedKey;
  });

  useEffect(() => {
    // If input changes, focus first item
    let first = state.collection.getFirstKey();
    if (state.collection.getItem(first)?.hasChildNodes) {
      first = state.collection.getItem(first).childNodes[0].key;
    }
    state.selectionManager.setFocusedKey(first);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.inputValue]);

  useEffect(() => {
    // Focus first item on open
    if (state.isOpen) {
      let first = state.collection.getFirstKey();
      if (state.collection.getItem(first)?.hasChildNodes) {
        first = state.collection.getItem(first).childNodes[0].key;
      }
      state.selectionManager.setFocusedKey(first);
      state.selectionManager.setFocused(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isOpen]);

  return {
    inputProps: mergeProps(inputProps, {
      role: 'combobox',
      'aria-expanded': menuTriggerProps['aria-expanded'],
      'aria-controls': state.isOpen ? menuProps.id : undefined,
      'aria-autocomplete': 'list',
      'aria-activedescendant': focusedItem ? getItemId(state, focusedItem.key) : undefined,
      // This disable's iOS's autocorrect suggestions, since the command palette provides its own suggestions.
      autoCorrect: 'off',
      // This disable's the macOS Safari spell check auto corrections.
      spellCheck: 'false'
    }),
    listBoxProps: mergeProps(menuProps, listBoxProps, {
      autoFocus: state.focusStrategy,
      shouldUseVirtualFocus: true,
      shouldSelectOnPressUp: true,
      shouldFocusOnHover: true
    })
  };
}