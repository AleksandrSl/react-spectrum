/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {act, waitFor, within} from '@testing-library/react';

type InteractionType = 'mouse' | 'touch' | 'keyboard'

interface SelectOptions {
  // I think the type grabbed from the testing library dist for UserEvent is breaking the build, will need to figure out a better place to grab from
  user: any,
  interactionType?: InteractionType
}
export class SelectTester {
  private user;
  private _interactionType: InteractionType;
  // TODO: Potential problem with tracking these internally is that the user might perform some interactions
  // themselves and thus we won't update them... I've tried to mitigate this by making the getters update these values
  // when called but I wonder if it is worth even exposing these getters
  private _element: HTMLElement;
  private _trigger: HTMLElement;
  private _listbox: HTMLElement | undefined;
  private _options: HTMLElement[] | undefined;
  private _sections: HTMLElement[] | undefined;
  // TODO: should we find the label/field error/etc for the user
  // what about value placeholder? Not entirely sure that there is a ton of value in helping the
  // user find those when they can be queried by getByText or by looking up the labeledby that the user already
  // provided. Also since those aren't always kept up to date since it is grabbed by document.getElementById,
  // it would be better for the user to not look for the specific node

  constructor(opts: SelectOptions) {
    this.user = opts.user;
    this._interactionType = opts.interactionType || 'mouse';
  }

  setElement(element: HTMLElement) {
    this._element = element;
    // Handle case where the wrapper element is provided rather than the Select's button (aka RAC)
    let triggerButton = within(this._element).queryByRole('button');
    if (triggerButton == null) {
      triggerButton = this._element;
    }
    this._trigger = triggerButton;
    // Reset the previously obtained elements since we may be interacting with a different element now
    this._listbox = undefined;
    this._options = undefined;
    this._sections = undefined;
  }

  setInteractionType(type: InteractionType) {
    this._interactionType = type;
  }

  async open() {
    if (!this._element) {
      throw new Error('Select element hasn\'t beeen set yet, please call setElement(element) to set which element to target.');
    }

    if (this._interactionType === 'mouse') {
      await this.user.click(this._trigger);
    } else if (this._interactionType === 'keyboard') {
      act(() => this._trigger.focus());
      await this.user.keyboard('[Enter]');
    } else if (this._interactionType === 'touch') {
      await this.user.pointer({target: this._trigger, keys: '[TouchA]'});
    }

    // TODO: so far this seems to work with real and fake timers. If we do run into a situation where we need to advance timers in here,
    // we can do something like detecting if fake timers (like in https://github.com/testing-library/react-testing-library/blame/c63b873072d62c858959c2a19e68f8e2cc0b11be/src/pure.js#L16)
    // are enabled and advance by a specific amount of time (here it would be doing advanceTimersBy perhaps by the transtion time or runOnlyPendingTimers)
    // Alternatively, maybe we need to accept an option for https://testing-library.com/docs/user-event/options/#advancetimers
    await waitFor(() => {
      if (this._trigger.getAttribute('aria-controls') == null) {
        throw new Error('No aria-controls found on select element trigger.');
      } else {
        return true;
      }
    });
    let listBoxId = this._trigger.getAttribute('aria-controls');
    await waitFor(() => {
      if (!listBoxId || document.getElementById(listBoxId) == null) {
        throw new Error(`ListBox with id of ${listBoxId} not found in document.`);
      } else {
        return true;
      }
    });
    this.getOptions();
  }

  getOptions() {
    if (!this._trigger.getAttribute('aria-controls')) {
      throw new Error('Select listbox hasn\'t been set yet. Did you call `open()` yet?');
    }
    let listBoxId = this._trigger.getAttribute('aria-controls');
    if (listBoxId) {
      let listbox = document.getElementById(listBoxId);
      if (listbox) {
        this._listbox = listbox;

        this._options = within(this._listbox).getAllByRole('option');
        this._sections = within(this._listbox).queryAllByRole('group');
      }
    }
  }

  async selectOption(optionText) {
    if (!this._trigger.getAttribute('aria-controls')) {
      await this.open();
    } else if (this._listbox) {
      this.getOptions();
    }

    if (this._listbox) {
      let option = within(this._listbox).getByText(optionText);
      if (this._interactionType === 'keyboard') {
        if (document.activeElement !== this._listbox || !this._listbox.contains(document.activeElement)) {
          // @ts-ignore TODO figure out what it thinks listbox might not be defined here
          act(() => this._listbox.focus());
        }

        // TODO: this simulates typeahead, do we want to add a helper util for that? Not sure if users would really need that for
        // their test
        await this.user.keyboard(optionText);
        await this.user.keyboard('[Enter]');
      } else {
        // TODO: what if the user needs to scroll the list to find the option? What if there are multiple matches for text (hopefully the picker options are pretty unique)
        if (this._interactionType === 'mouse') {
          await this.user.click(option);
        } else {
          await this.user.pointer({target: option, keys: '[TouchA]'});
        }
      }

      if (option.getAttribute('href') == null) {
        // TODO: make reusuable version of these assertions since they will appear in a lot of places to replace jest assertions
        await waitFor(() => {
          if (document.activeElement !== this.trigger) {
            throw new Error(`Expected the document.activeElement after selecting an option to be the select component trigger but got ${document.activeElement}`);
          } else {
            return true;
          }
        });

        if (document.contains(this._listbox)) {
          throw new Error('Expected select element listbox to not be in the document after selecting an option');
        }
      }
    }
  }

  async close() {
    if (this._trigger.getAttribute('aria-controls')) {
      // @ts-ignore TODO figure out what it thinks listbox might not be defined here
      act(() => this._listbox.focus());
      await this.user.keyboard('[Escape]');
    }

    await waitFor(() => {
      if (document.activeElement !== this.trigger) {
        throw new Error(`Expected the document.activeElement after closing the select dropdown to be the select component trigger but got ${document.activeElement}`);
      } else {
        return true;
      }
    });

    if (this._listbox && document.contains(this._listbox)) {
      throw new Error('Expected the select element listbox to not be in the document after closing the dropdown.');
    }
  }

  // TODO is it valuable to add support for a utility for pressing ArrowLeft/ArrowRight when the picker is closed to cycle through the options?
  // Doesn't really feel that useful since it isn't very complicated and I don't think people really need access to every single supported interaction
  // since we should already be testing them

  // TODO: perhaps these should be getElement/getTrigger/etc. That way the user could destruct them from the class without explicitlly triggering the getter
  // TODO: name element here to just be picker perhaps
  get element() {
    if (!this._element) {
      throw new Error('Select element hasn\'t been set yet. Did you call `setElement()` yet?');
    }

    return this._element;
  }

  get trigger() {
    if (!this._trigger) {
      throw new Error('Select trigger hasn\'t been set yet. Did you call `setElement()` yet?');
    }

    return this._trigger;
  }

  get listbox() {
    // If user has triggered open the select themseleves, then grab the options and set the listbox element
    if (this._trigger.getAttribute('aria-controls')) {
      this.getOptions();
    } else if (!this._listbox) {
      throw new Error('Select listbox hasn\'t been set yet. Did you call `open()` yet?');
    }

    return this._listbox;
  }

  get options() {
    if (this._trigger.getAttribute('aria-controls')) {
      this.getOptions();
    } else if (!this._options) {
      throw new Error('Select options hasn\'t been set yet. Did you call `open()` yet?');
    }

    return this._options;
  }

  get sections() {
    if (this._trigger.getAttribute('aria-controls')) {
      this.getOptions();
    } else if (!this._sections) {
      throw new Error('Select sections hasn\'t been set yet. Did you call `open()` yet? Are there sections available?');
    }

    return this._sections;
  }

  get interactionType() {
    return this._interactionType;
  }
}