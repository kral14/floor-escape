// 10-CU QAT SANDIQ SİSTEMİ (MILESTONE CHEST MODAL)

let currentPendingRewardFloor = 0;

function checkMilestoneChest(floor) {
    if (floor % 10 === 0 && !claimedChests.includes(floor)) {
        currentPendingRewardFloor = floor;
        const rewardCount = floor / 10; // 10->1, 20->2, 30->3...

        const rubySvg = (typeof ICONS !== 'undefined') ? ICONS.rubyDiamond({ size: 22 }) : '<span data-icon="103" data-size="22"></span>';
        const titleEl = document.getElementById('chest-floor-title');
        const descEl = document.getElementById('chest-reward-desc');
        const countEl = document.getElementById('chest-reward-count');
        
        if (titleEl) titleEl.innerText = `${floor}-CU QAT SANDIĞI!`;
        if (descEl) descEl.innerText = `Təbriklər! ${floor}-cu qata çatdınız. Bu sandıqdan sizə birdəfəlik ${rewardCount} Fancy Elmas təqdim olunur!`;
        if (countEl) countEl.innerHTML = `<span class="inline-flex items-center gap-1.5">+${rewardCount} ${rubySvg} Fancy Elmas</span>`;

        const overlay = document.getElementById('chest-overlay');
        if (overlay) overlay.classList.remove('hidden');
        if (typeof audio !== 'undefined' && audio.playChest) audio.playChest();
        return true;
    }
    return false;
}

function claimMilestoneChest() {
    if (currentPendingRewardFloor <= 0) return;
    const floor = currentPendingRewardFloor;

    if (!claimedChests.includes(floor)) {
        const rewardCount = floor / 10;
        redDiamonds += rewardCount;
        claimedChests.push(floor);
        savePermanentData();

        if (typeof audio !== 'undefined' && audio.playDiamond) audio.playDiamond();
        showToast(`🎁 +${rewardCount} Fancy Elmas Qazanıldı!`, 'redDiamond');
        if (typeof updateUI === 'function') updateUI();
    }

    currentPendingRewardFloor = 0;
    const overlay = document.getElementById('chest-overlay');
    if (overlay) overlay.classList.add('hidden');
}

window.checkMilestoneChest = checkMilestoneChest;
window.claimMilestoneChest = claimMilestoneChest;
