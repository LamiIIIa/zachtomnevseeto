import { forumConfig } from "../config/forum.js";
import { t } from "../i18n/index.js";

export function initProfile({ root, main, userId }) {
  main?.classList.add("forum-design-profile");
  if (userId !== null) main?.setAttribute("data-user-id", String(userId));

  placeProfileNavigation(root, main);
  lockRestrictedProfile(main);
}

function placeProfileNavigation(root, main) {
  if (!root || !main) return;

  const viewProfile = main.querySelector("#viewprofile");
  if (!viewProfile) return;

  const profileNavigation = root.querySelector(
    "#viewprofile-next > #profilenav"
  );

  const topCrumbs = root.querySelector("#pun-crumbs1 .crumbs");

  if (!profileNavigation || !topCrumbs) return;

  topCrumbs.replaceWith(profileNavigation);

  profileNavigation.style.removeProperty("display");
  profileNavigation.removeAttribute("hidden");
  profileNavigation.classList.add("profile-section-menu");
}

function lockRestrictedProfile(main) {
  if (
    !main ||
    !forumConfig.profile.lockedGroupIds.includes(Number(window.GroupID))
  )
    return;

  const submitButtons = main.querySelectorAll(
    'input[type="submit"], button[type="submit"]'
  );
  if (!submitButtons.length) return;

  submitButtons.forEach((button) => {
    button.disabled = true;
  });

  const submitArea = main.querySelector(".formsubmit");
  if (!submitArea || submitArea.querySelector(".profile-lock-notice")) return;

  const notice = document.createElement("span");
  notice.className = "profile-lock-notice";
  notice.dataset.i18n = "profile.editLocked";
  notice.textContent = t("profile.editLocked");
  submitArea.append(notice);
}
