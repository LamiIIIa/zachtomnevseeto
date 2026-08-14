/* Snapshot source: https://forumstatic.ru/files/0017/95/29/40399.js; source encoding: utf-8 */
/**
 * Скрипт стикеров
 * автор: Человек-Шаман
 * version: 1.0.10
 *
 * Что нового:
 * 1. Добавлено ограничение на количество загружаемых одноыременно стикеров
 */
const hvStickerPack = {
  loading: false,
  data: [],
  userData: [],
  isOpened: false,
  activeTab: '',
  isCustomEditMode: false,
  dragLongPressMs: 400,
  dragState: null,
  dragStartTimer: null,
  suppressStickerClick: false,
  renderBatchSize: 10,
  renderBatchIntervalMs: 100,
  renderQueueTimer: null,
  renderSessionId: 0,

  init: function (url) {
    if ($("#button-smile").length === 0) return;
    this.url = url;
    this.handleTdClick = this.handleTdClick.bind(this);
    this.setLoading = this.setLoading.bind(this);
    this.parseLoadedData = this.parseLoadedData.bind(this);
    this.handleTabsClick = this.handleTabsClick.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleAddButtonClick = this.handleAddButtonClick.bind(this);
    this.handleToggleCustomEditMode = this.handleToggleCustomEditMode.bind(this);
    this.handleSaveCustomEditMode = this.handleSaveCustomEditMode.bind(this);
    this.handleCancelCustomEditMode = this.handleCancelCustomEditMode.bind(this);
    this.handleContentClick = this.handleContentClick.bind(this);
    this.handleStickerPressStart = this.handleStickerPressStart.bind(this);
    this.handleStickerPressMove = this.handleStickerPressMove.bind(this);
    this.handleStickerPressEnd = this.handleStickerPressEnd.bind(this);
    this.handleStickerPressCancel = this.handleStickerPressCancel.bind(this);
    this.startDraggingSticker = this.startDraggingSticker.bind(this);
    this.applyUserDataOrderFromDom = this.applyUserDataOrderFromDom.bind(this);
    this.getEventPoint = this.getEventPoint.bind(this);
    this.clearDragStartTimer = this.clearDragStartTimer.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.addStyle();
    this.addButton();
  },
  addStyle: function () {
    const style = $('<link rel="stylesheet" href="https://forumstatic.ru/files/0017/95/29/89523.css">');
    $("head").append(style);
  },
  addButton: function () {
    this.button = $('<td title="Стикеры" id="button-sticker"></td>');
    this.button.on("click", this.handleTdClick);

    const smile = $("#button-smile");
    smile.after(this.button);
  },
  renderModal: function () {
    if (this.modal) {
      this.toggleModal(true);
      return;
    }

    this.modalContainer = $('<div class="hvStickerPackModalContainer"></div>');
    this.modal = $('<div class="hvStickerPackModal"></div>');
    this.modalTabs = $('<div class="hvStickerPackModalTabs"></div>');
    this.modalContent = $('<div class="hvStickerPackModalContent"></div>');
    this.addContainer = $('<div class="hvStickerPackModalAdd hidden"></div>');
    this.stickerInput = $(
      '<input class="hvStickerPackModalInput" type="text" placeholder="Url стикера">'
    );
    this.addStickerButton = $(
      '<input class="hvStickerPackModalAddButton" type="button" value="+">'
    );
    this.editModeButton = $(
      '<input class="hvStickerPackModalAddButton hvStickerPackModalEditButton" type="button" value="\u{270e}">'
    );
    this.bulkContainer = $('<div class="hvStickerPackModalContent hvStickerPackModalBulk hidden"></div>');
    this.bulkInput = $(
      '<textarea class="hvStickerPackModalInput hvStickerPackModalTextarea" rows="6" placeholder="Вставь URL стикеров (по одному в строке или через пробел)"></textarea>'
    );
    this.bulkSaveButton = $(
      '<input class="hvStickerPackModalAddButton hvStickerPackModalSaveButton" type="button" value="Сохранить">'
    );
    this.bulkCancelButton = $(
      '<input class="hvStickerPackModalAddButton hvStickerPackModalCancelButton" type="button" value="Отмена">'
    );
    this.bulkContainer.append(this.bulkInput);
    this.bulkContainer.append(this.bulkSaveButton);
    this.bulkContainer.append(this.bulkCancelButton);
    this.addContainer.append(this.stickerInput);
    this.addContainer.append(this.addStickerButton);
    this.addContainer.append(this.editModeButton);

    this.modal.append(this.modalContent);
    this.modal.append(this.bulkContainer);
    this.modal.append(this.addContainer);
    this.modal.append(this.modalTabs);
    this.modalContainer.append(this.modal);

    this.data.forEach(pack => {
      if (pack.stickers.length === 0) {
        return;
      }
      hvStickerPack.modalTabs.append(`<div class="hvStickerPackModalTab" data-pack="${pack.name}">${pack.name}</div>`);
    });
    if (GroupID !== 3) {
      hvStickerPack.modalTabs.append(
        '<div class="hvStickerPackModalTab" data-pack="Свои">Свои</div>'
      );
    }

    this.modalTabs.on("click", this.handleTabsClick);
    this.modalContent.on("click", this.handleContentClick);
    this.addStickerButton.on("click", this.handleAddButtonClick);
    this.editModeButton.on("click", this.handleToggleCustomEditMode);
    this.bulkSaveButton.on("click", this.handleSaveCustomEditMode);
    this.bulkCancelButton.on("click", this.handleCancelCustomEditMode);

    $("body").append(this.modalContainer);
    this.toggleModal(true);
  },
  closeModal: function () {
    this.toggleModal(false);
  },
  setTab: function (tabName) {
    const self = this;
    this.activeTab = tabName;
    this.cancelStickerRender();
    this.renderSessionId += 1;
    const currentRenderSessionId = this.renderSessionId;
    const isCustomTab = this.activeTab === "Свои";
    if (!isCustomTab) {
      this.resetCustomEditMode();
    }
    $(this.modalTabs)
      .find(".hvStickerPackModalTab")
      .removeClass("active");
    $(this.modalTabs)
      .find(`.hvStickerPackModalTab[data-pack="${this.activeTab}"]`)
      .addClass("active");

    const pack = isCustomTab
      ? {
        name: "Свои",
        stickers: this.userData
      }
      : this.data.find(pack => pack.name === self.activeTab);
    $(self.modalContent).empty();
    this.renderTabStickers(pack.stickers, isCustomTab, currentRenderSessionId);
    this.toggleAddTab(isCustomTab);
  },
  renderTabStickers: function (stickers, isCustomTab, sessionId) {
    let pointer = 0;

    const renderChunk = () => {
      if (sessionId !== this.renderSessionId) {
        return;
      }

      const chunk = [];
      const end = Math.min(pointer + this.renderBatchSize, stickers.length);
      for (let index = pointer; index < end; index++) {
        const url = stickers[index];
        chunk.push(this.getStickerItemHtml(url, isCustomTab));
      }
      if (chunk.length) {
        $(this.modalContent).append(chunk.join(""));
      }
      pointer = end;

      if (pointer < stickers.length) {
        this.renderQueueTimer = setTimeout(renderChunk, this.renderBatchIntervalMs);
      } else {
        this.renderQueueTimer = null;
      }
    };

    if (!stickers.length) {
      this.renderQueueTimer = null;
      return;
    }
    this.renderQueueTimer = setTimeout(renderChunk, this.renderBatchIntervalMs);
  },
  getStickerItemHtml: function (url, isCustomTab) {
    const removeButton = isCustomTab
      ? '<span class="hvStickerPackRemoveItem" title="Удалить">x</span>'
      : '';
    return `<div class="hvStickerPackItem" data-sticker="${url}"><img src="${url}">${removeButton}</div>`;
  },
  cancelStickerRender: function () {
    if (this.renderQueueTimer) {
      clearTimeout(this.renderQueueTimer);
      this.renderQueueTimer = null;
    }
  },
  toggleAddTab: function (isCustom) {
    const isBulkMode = isCustom && this.isCustomEditMode;
    this.addContainer.toggleClass("hidden", !isCustom || isBulkMode);
    this.bulkContainer.toggleClass("hidden", !isBulkMode);
    this.modalContent.toggleClass("hidden", isBulkMode);
    if (isBulkMode) {
      $(this.bulkInput).val(this.userData.join("\n"));
    }
  },
  setLoading: function (isLoading) {
    this.loading = Boolean(isLoading);
    this.button.toggleClass("loading", isLoading);
  },
  parseLoadedData: function (data) {
    const stickerArray = data.split(/\r?\n/);
    let pointer = 0;
    let pointerName = "Pack 1";

    stickerArray.forEach(str => {
      str = str
        .replace(String.fromCharCode(13), '')
        // в 2025 году внутренний хостинг файлов mybb сменился, фикс автоматически заменяет ссылки
        .replace(/^https?:\/\/forumupload.ru\//, 'https://upforme.ru/');
      const isImg = /\.(gif|jpe?g|png|webp)/i.test(str);

      if (isImg) {
        if (!hvStickerPack.data[pointer]) {
          hvStickerPack.data[pointer] = {
            name: pointerName,
            stickers: []
          };
        }
        hvStickerPack.data[pointer].stickers.push(str);
      } else {
        if (str === "") {
          pointerName = `Pack ${hvStickerPack.data.length + 1}`;
          if (hvStickerPack.data[pointer]) {
            pointer++;
          }
        } else {
          pointerName = str;
        }
      }
    });
    hvStickerPack.activeTab = hvStickerPack.data[0].name
  },
  handleTdClick: function (event) {
    event.stopPropagation();
    if (this.loading) {
      return;
    }

    if (this.data.length) {
      this.toggleModal();
      return;
    }

    this.setLoading(true);
    this.loadForumStickers();
    if (GroupID !== 3) {
      this.loadUserStickers();
    }
  },
  handleTabsClick: function (event) {
    const target = $(event.target).closest(".hvStickerPackModalTab");
    if (target.length) {
      this.setTab(target.attr("data-pack"));
    }
  },
  handleContentClick: function (event) {
    event.stopPropagation();
    const target = $(event.target).closest(".hvStickerPackRemoveItem");
    if (target.length) {
      const stickerItem = target.closest(".hvStickerPackItem");
      const link = stickerItem.attr("data-sticker");
      const index = this.userData.indexOf(link);
      if (index !== -1) {
        this.userData.splice(index, 1);
        this.setUserData();
      }
      stickerItem.remove();
      return;
    }

    const sticker = $(event.target).closest(".hvStickerPackItem");
    if (sticker.length && this.activeTab === "Свои" && this.suppressStickerClick) {
      this.suppressStickerClick = false;
      return;
    }
    if (sticker.length) {
      const link = sticker.attr("data-sticker");
      smile(`[img]${link}[/img]`);
    }
  },
  handleAddButtonClick: function () {
    const link = $(this.stickerInput).val();
    const isImg = this.isValidStickerUrl(link);

    if (isImg && !this.userData.includes(link)) {
      this.userData.push(link);
      this.setUserData();
      $(this.modalContent).append(this.getStickerItemHtml(link, true));
      $(this.stickerInput).val("");
    }
  },
  handleToggleCustomEditMode: function () {
    this.isCustomEditMode = true;
    this.toggleAddTab(true);
  },
  handleCancelCustomEditMode: function () {
    this.resetCustomEditMode();
    this.toggleAddTab(true);
  },
  handleSaveCustomEditMode: function () {
    const rawValue = String($(this.bulkInput).val() || "");
    const links = rawValue
      .split(/\s+/)
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => item.replace(/^https?:\/\/forumupload.ru\//, 'https://upforme.ru/'))
      .filter(item => this.isValidStickerUrl(item));
    const uniqueLinks = Array.from(new Set(links));

    this.userData = uniqueLinks;
    this.setUserData();
    this.isCustomEditMode = false;
    this.setTab("Свои");
  },
  isValidStickerUrl: function (url) {
    return /(^https?:\/\/.*\.(?:png|jpe?g|gif|webp)(?:\?.*)?$)/i.test(url);
  },
  resetCustomEditMode: function () {
    this.isCustomEditMode = false;
    if (this.bulkInput) {
      $(this.bulkInput).val(this.userData.join("\n"));
    }
  },
  handleStickerPressStart: function (event) {
    if (this.activeTab !== "Свои" || this.isCustomEditMode) {
      return;
    }
    if ($(event.target).closest(".hvStickerPackRemoveItem").length) {
      return;
    }
    if (event.type === "mousedown" && event.which !== 1) {
      return;
    }

    const item = $(event.currentTarget);
    const point = this.getEventPoint(event);
    if (!point) {
      return;
    }
    this.clearDragStartTimer();
    this.dragState = {
      item,
      startX: point.clientX,
      startY: point.clientY,
      x: point.clientX,
      y: point.clientY,
      offsetX: 0,
      offsetY: 0,
      dragging: false,
      moved: false
    };
    this.dragStartTimer = setTimeout(() => {
      this.startDraggingSticker();
    }, this.dragLongPressMs);
  },
  handleStickerPressMove: function (event) {
    if (!this.dragState) {
      return;
    }
    const point = this.getEventPoint(event);
    if (!point) {
      return;
    }
    this.dragState.x = point.clientX;
    this.dragState.y = point.clientY;

    const deltaX = Math.abs(this.dragState.x - this.dragState.startX);
    const deltaY = Math.abs(this.dragState.y - this.dragState.startY);
    if (!this.dragState.dragging && (deltaX > 8 || deltaY > 8)) {
      this.clearDragStartTimer();
    }
    if (!this.dragState.dragging) {
      return;
    }

    this.dragState.moved = true;
    event.preventDefault();

    this.dragState.item.css({
      left: `${this.dragState.x - this.dragState.offsetX}px`,
      top: `${this.dragState.y - this.dragState.offsetY}px`
    });

    const element = document.elementFromPoint(this.dragState.x, this.dragState.y);
    const target = $(element).closest(".hvStickerPackItem");
    if (!target.length || target.is(this.dragState.item) || target.hasClass("drag-placeholder")) {
      return;
    }

    const rect = target[0].getBoundingClientRect();
    const rowDelta = Math.abs(this.dragState.y - (rect.top + rect.height / 2));
    const isUpperRow = this.dragState.y < rect.top + rect.height * 0.25;
    const isLowerRow = this.dragState.y > rect.bottom - rect.height * 0.25;
    const insertBefore = isUpperRow || (!isLowerRow && rowDelta < rect.height / 2 && this.dragState.x < rect.left + rect.width / 2);

    if (insertBefore) {
      target.before(this.dragState.placeholder);
    } else {
      target.after(this.dragState.placeholder);
    }
  },
  handleStickerPressEnd: function () {
    this.clearDragStartTimer();
    if (!this.dragState) {
      return;
    }
    if (this.dragState.dragging) {
      this.dragState.item.removeAttr("style").removeClass("dragging");
      if (this.dragState.placeholder && this.dragState.placeholder.length) {
        this.dragState.placeholder.replaceWith(this.dragState.item);
      }
      this.applyUserDataOrderFromDom();
      this.setUserData();
      this.suppressStickerClick = true;
    }
    this.dragState = null;
  },
  handleStickerPressCancel: function () {
    this.clearDragStartTimer();
    if (!this.dragState) {
      return;
    }
    if (this.dragState.dragging) {
      this.dragState.item.removeAttr("style").removeClass("dragging");
      if (this.dragState.placeholder && this.dragState.placeholder.length) {
        this.dragState.placeholder.replaceWith(this.dragState.item);
      }
    }
    this.dragState = null;
  },
  clearDragStartTimer: function () {
    if (this.dragStartTimer) {
      clearTimeout(this.dragStartTimer);
      this.dragStartTimer = null;
    }
  },
  startDraggingSticker: function () {
    if (!this.dragState || this.dragState.dragging) {
      return;
    }
    const item = this.dragState.item;
    const rect = item[0].getBoundingClientRect();
    this.dragState.offsetX = this.dragState.x - rect.left;
    this.dragState.offsetY = this.dragState.y - rect.top;
    this.dragState.placeholder = $('<div class="hvStickerPackItem drag-placeholder"></div>').css({
      width: rect.width,
      height: rect.height,
      visibility: "hidden"
    });
    item.after(this.dragState.placeholder);
    item.addClass("dragging").css({
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: 9999,
      pointerEvents: "none",
      opacity: 0.85
    });
    this.dragState.dragging = true;
  },
  applyUserDataOrderFromDom: function () {
    const ordered = [];
    this.modalContent.find(".hvStickerPackItem").each(function () {
      const value = $(this).attr("data-sticker");
      if (value) {
        ordered.push(value);
      }
    });
    this.userData = ordered;
  },
  getEventPoint: function (event) {
    const source = event.originalEvent || event;
    if (source.changedTouches && source.changedTouches[0]) {
      return source.changedTouches[0];
    }
    if (source.touches && source.touches[0]) {
      return source.touches[0];
    }
    if (typeof source.clientX === "number" && typeof source.clientY === "number") {
      return source;
    }
    return null;
  },
  setUserData() {
    const value = this.checkedUserData(this.userData);
    $.post("/api.php", {
      method: "storage.set",
      token: ForumAPITicket,
      key: "hvStickerPack",
      value,
    });
  },
  checkedUserData(userData) {
    const string = JSON.stringify(userData);
    if (string.length >= 65000) {
      $.jGrowl("Слишком много стикеров, последний не был сохранён 😔");
      userData.pop();
      return this.checkedUserData(userData)
    } else {
      return string;
    }
  },
  handleOutsideClick: function (event) {
    var target = $(event.target);
    if (!target.closest(".hvStickerPackModal").length) {
      hvStickerPack.toggleModal(false);
    }
  },
  loadForumStickers: function () {
    $.get(this.url, data => {
      hvStickerPack.parseLoadedData(data);
      hvStickerPack.setLoading(false);
      hvStickerPack.renderModal();
    }).fail(() => {
      $.jGrowl("Стикеры не грузятся, что-то пошло не так 😔 Может, поможет перезагрузка страницы?");
    });
  },
  loadUserStickers: function () {
    if (UserID === 1) {
      return;
    }

    $.ajax({
      async: false,
      url: "/api.php",
      data: {
        method: "storage.get",
        key: "hvStickerPack"
      },
      success: result => {
        const response = result.response?.storage?.data?.hvStickerPack || '';

        if (response) {
          try {
            const userData = JSON.parse(response);
            // в 2025 году внутренний хостинг файлов mybb сменился, фикс автоматически заменяет ссылки
            const clearedData = userData.map(item => item.replace(/^https?:\/\/forumupload.ru\//, 'https://upforme.ru/'));
            hvStickerPack.userData = clearedData;
          } catch (err) {
            if (err.name === 'SyntaxError' && response.length > 65000) {
              this.setUserData();
              $.jGrowl("Стикеры сохранились критично неправильно, мне пришлось очистить хранилище. Очень извиняюсь 😥");
            }
          }
        }
      },
      error: () => {
        $.jGrowl("Твои стикеры не прогрузились, придется пользоваться форумными 😒");
      }
    });
  },
  toggleModal: function (isOpened) {
    const open = typeof isOpened !== "undefined" ? Boolean(isOpened) : !this.isOpened;

    if (open) {
      const offset = $("#wysi-reply:visible,#main-reply:visible").offset() || $("#post-form").offset();
      this.modalContainer.css({
        position: "absolute",
        top: offset.top,
        left: offset.left
      });
      this.modal.css({
        width: $("#wysi-reply:visible,#main-reply:visible").width() || $("#post-form").width(),
      });

      this.setTab(this.activeTab);
      this.modalContent.on("mousedown touchstart", ".hvStickerPackItem", this.handleStickerPressStart);
      $(document).on("mousemove touchmove", this.handleStickerPressMove);
      $(document).on("mouseup touchend", this.handleStickerPressEnd);
      $(document).on("touchcancel", this.handleStickerPressCancel);
      $(document).on("click", this.handleOutsideClick);
      $(document).on("pun_post", this.closeModal);
      $(document).on("pun_preview", this.closeModal);
      $(document).on("pun_preedit", this.closeModal);
      $(document).on("pun_edit", this.closeModal);
      $(document).on("messenger:post", this.closeModal);
    } else {
      this.handleStickerPressCancel();
      this.cancelStickerRender();
      this.modalContent.off("mousedown touchstart", ".hvStickerPackItem", this.handleStickerPressStart);
      $(document).off("mousemove touchmove", this.handleStickerPressMove);
      $(document).off("mouseup touchend", this.handleStickerPressEnd);
      $(document).off("touchcancel", this.handleStickerPressCancel);
      $(document).off("pun_post", this.closeModal);
      $(document).off("pun_preview", this.closeModal);
      $(document).off("pun_preedit", this.closeModal);
      $(document).off("pun_edit", this.closeModal);
      $(document).off("messenger:post", this.closeModal);
      $(document).off("click", this.handleOutsideClick);
    }

    this.modal.toggleClass("active", open);
    this.isOpened = open;
  }
};
