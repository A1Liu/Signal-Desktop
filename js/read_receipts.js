// Copyright 2016-2020 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

/* global
  Whisper,
  Backbone,
  _,
  ConversationController,
  MessageController,
*/

/* eslint-disable more/no-then */

// eslint-disable-next-line func-names
(function () {
  window.Whisper = window.Whisper || {};
  Whisper.ReadReceipts = new (Backbone.Collection.extend({
    forMessage(conversation, message) {
      if (!message.isOutgoing()) {
        return [];
      }
      let ids = [];
      if (conversation.isPrivate()) {
        ids = [conversation.id];
      } else {
        ids = conversation.getMemberIds();
      }
      const receipts = this.filter(
        receipt =>
          receipt.get('timestamp') === message.get('sent_at') &&
          _.contains(ids, receipt.get('reader'))
      );
      if (receipts.length) {
        window.log.info('Found early read receipts for message');
        this.remove(receipts);
      }
      return receipts;
    },
    async getTargetMessage(reader, messages) {
      if (messages.length === 0) {
        return null;
      }
      const message = messages.find(
        item => item.isOutgoing() && reader === item.get('conversationId')
      );
      if (message) {
        return MessageController.register(message.id, message);
      }

      const groups = await window.Signal.Data.getAllGroupsInvolvingId(reader, {
        ConversationCollection: Whisper.ConversationCollection,
      });
      const ids = groups.pluck('id');
      ids.push(reader);

      const target = messages.find(
        item => item.isOutgoing() && _.contains(ids, item.get('conversationId'))
      );
      if (!target) {
        return null;
      }

      return MessageController.register(target.id, target);
    },
    async onReceipt(receipt) {
      try {
        const messages = await window.Signal.Data.getMessagesBySentAt(
          receipt.get('timestamp'),
          {
            MessageCollection: Whisper.MessageCollection,
          }
        );

        const message = await this.getTargetMessage(
          receipt.get('reader'),
          messages
        );

        if (!message) {
          window.log.info(
            'No message for read receipt',
            receipt.get('reader'),
            receipt.get('timestamp')
          );
          return;
        }

        const readBy = message.get('read_by') || [];
        const expirationStartTimestamp = message.get(
          'expirationStartTimestamp'
        );

        readBy.push(receipt.get('reader'));
        message.set({
          read_by: readBy,
          expirationStartTimestamp: expirationStartTimestamp || Date.now(),
          sent: true,
        });

        if (message.isExpiring() && !expirationStartTimestamp) {
          // TODO DESKTOP-1509: use setToExpire once this is TS
          await message.setToExpire(false, { skipSave: true });
        }

        window.Signal.Util.queueUpdateMessage(message.attributes);

        // notify frontend listeners
        const conversation = ConversationController.get(
          message.get('conversationId')
        );
        const updateLeftPane = conversation
          ? conversation.debouncedUpdateLastMessage
          : undefined;
        if (updateLeftPane) {
          updateLeftPane();
        }

        this.remove(receipt);
      } catch (error) {
        window.log.error(
          'ReadReceipts.onReceipt error:',
          error && error.stack ? error.stack : error
        );
      }
    },
  }))();
})();
