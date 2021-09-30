// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { useState } from 'react';
import moment from 'moment';

import { Modal } from './Modal';
import { Intl, IntlComponentsType } from './Intl';
import { Emojify } from './conversation/Emojify';
import { LocalizerType } from '../types/Util';

export type PropsType = {
  i18n: LocalizerType;
};

type ReleaseNotesType = {
  date: Date;
  version: string;
  features: Array<{ key: string; components: IntlComponentsType }>;
};

export const WhatsNew = ({ i18n }: PropsType): JSX.Element => {
  const [releaseNotes, setReleaseNotes] = useState<
    ReleaseNotesType | undefined
  >();

  const viewReleaseNotes = () => {
    setReleaseNotes({
      date: new Date(window.getBuildCreation?.() || Date.now()),
      version: window.getVersion(),
      features: [
        { key: 'WhatsNew__v5.19--1', components: undefined },
        { key: 'WhatsNew__v5.19--2', components: undefined },
        { key: 'WhatsNew__v5.19--3', components: undefined },
        { key: 'WhatsNew__v5.19--4', components: undefined },
      ],
    });
  };

  return (
    <>
      {releaseNotes && (
        <Modal
          hasXButton
          i18n={i18n}
          onClose={() => setReleaseNotes(undefined)}
          title={i18n('WhatsNew__modal-title')}
        >
          <>
            <span>
              {moment(releaseNotes.date).format('LL')} &middot;{' '}
              {releaseNotes.version}
            </span>
            <ul>
              {releaseNotes.features.map(({ key, components }) => (
                <li key={key}>
                  <Intl
                    i18n={i18n}
                    id={key}
                    renderText={({ key: innerKey, text }) => (
                      <Emojify key={innerKey} text={text} />
                    )}
                    components={components}
                  />
                </li>
              ))}
            </ul>
          </>
        </Modal>
      )}
      <Intl
        i18n={i18n}
        id="whatsNew"
        components={[
          <button className="WhatsNew" type="button" onClick={viewReleaseNotes}>
            {i18n('viewReleaseNotes')}
          </button>,
        ]}
      />
    </>
  );
};