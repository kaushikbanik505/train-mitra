import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();

  // --- Case 1: logged out ---
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Learner' }).click();
  await page.waitForTimeout(300);
  const comingSoonVisible = await page.getByText('Coming soon').isVisible();
  const urlAfterClick = page.url();
  console.log('Case1 (logged out) - Coming soon visible:', comingSoonVisible, '| still on same page:', urlAfterClick === BASE + '/');

  // direct URL nav while logged out
  await page.goto(BASE + '/learner');
  await page.waitForTimeout(500);
  console.log('Case1b (logged out, direct URL) - redirected to:', page.url());

  // --- Case 2: logged in as a NON-owner ---
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'fake');
    localStorage.setItem('refreshToken', 'fake');
    localStorage.setItem('user', JSON.stringify({ email: 'someoneelse@example.com', name: 'Someone', role: 'user' }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Learner' }).click();
  await page.waitForTimeout(300);
  const comingSoon2 = await page.getByText('Coming soon').isVisible();
  console.log('Case2 (non-owner logged in) - Coming soon visible:', comingSoon2, '| url:', page.url());

  await page.goto(BASE + '/learner');
  await page.waitForTimeout(500);
  console.log('Case2b (non-owner, direct URL) - redirected to:', page.url());

  // --- Case 3: logged in as the OWNER email (simulated via localStorage) ---
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'fake');
    localStorage.setItem('refreshToken', 'fake');
    localStorage.setItem('user', JSON.stringify({ email: 'iamkaushik018@gmail.com', name: 'Kaushik', role: 'user' }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Learner' }).click();
  await page.waitForTimeout(500);
  console.log('Case3 (owner logged in) - navigated to:', page.url());

  await browser.close();
})();
