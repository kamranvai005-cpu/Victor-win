// Official HGNice Win Go & Market Assets
export const WINGO_ASSETS = {
  // Official glossy 3D Lottery Balls 0-9
  balls: {
    0: 'https://hgnice.bet/assets/png/ball_0-Ca74Ns3T.png',
    1: 'https://hgnice.bet/assets/png/ball_1-DFUEzKvm.png',
    2: 'https://hgnice.bet/assets/png/ball_2-BA1HkQbr.png',
    3: 'https://hgnice.bet/assets/png/ball_3-CSGWgLyY.png',
    4: 'https://hgnice.bet/assets/png/ball_4-CU90k0Z5.png',
    5: 'https://hgnice.bet/assets/png/ball_5-DD5VBkEF.png',
    6: 'https://hgnice.bet/assets/png/ball_6-CRRe003w.png',
    7: 'https://hgnice.bet/assets/png/ball_7-Cf2z_aqK.png',
    8: 'https://hgnice.bet/assets/png/ball_8-BWd7rcUJ.png',
    9: 'https://hgnice.bet/assets/png/ball_9-DDw5YEZU.png',
  } as Record<number, string>,

  // Wallet header card background
  walletBg: 'https://hgnice.bet/assets/png/walletbg-B_xq3Fxh.png',

  // Win Go issue / period timer background
  wingoIssueBg: 'https://hgnice.bet/assets/png/wingoissue-CEx8JRqh.png',

  // Duration selector icons (Active & Inactive)
  timeInactive: 'https://hgnice.bet/assets/png/time-Dqn5mr54.png',
  timeActive: 'https://hgnice.bet/assets/png/time_a-C_I6uSm6.png',

  // Real-time balance refresh icon
  refreshIcon: 'https://hgnice.bet/assets/png/refireshIcon-DC4LQmAM.png',

  // Color button borders
  borderGreen: 'https://hgnice.bet/assets/png/border1-DBd7JI28.png',
  borderViolet: 'https://hgnice.bet/assets/png/border2-DsiUcZw7.png',
  borderRed: 'https://hgnice.bet/assets/png/border3-Dc5eCVuH.png',

  // Category & Card backgrounds
  lotteryBg: 'https://hgnice.bet/assets/png/lottery_bg-5smSNKtH.png',
  hotBg: 'https://hgnice.bet/assets/png/hot_bg-Bys5a_dm.png',
  gameMiniBg: 'https://hgnice.bet/assets/png/game_mini_bg-BL1LiQCS.png',
  fishBg: 'https://hgnice.bet/assets/png/fish_bg-DRZkmT3z.png',
  thirdBg: 'https://hgnice.bet/assets/png/third_bg-Cd4-iKeL.png',
};

export const getBallImage = (num: number | string): string => {
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  if (n >= 0 && n <= 9 && WINGO_ASSETS.balls[n]) {
    return WINGO_ASSETS.balls[n];
  }
  return WINGO_ASSETS.balls[0];
};
