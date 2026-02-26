import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Reels Creator exports video with audio track', async ({ page }) => {
    test.setTimeout(120000); // Allow time for encoding

    // Hook into console to see frontend errors
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Go to the app, bypassing auth
    await page.goto('http://localhost:5173/?test=true');

    // Click on "Criador de Reels AI" in the sidebar to activate the Reels Creator tab
    console.log('Navigating to Reels Creator via UI click...');
    const reelsTabBtn = page.locator('button').filter({ hasText: /Criador de Reels/i });
    await reelsTabBtn.first().click();

    // Wait for the dropzone or file input
    const fileInput = page.locator('input[accept*="video"]');
    await fileInput.waitFor({ state: 'attached', timeout: 10000 });

    console.log('Uploading test_input.mp4...');
    // Upload test video (created by ffmpeg with audio)
    await fileInput.setInputFiles(path.join(__dirname, '../test_input.mp4'));

    console.log('Waiting for video engine to load...');
    // Wait for the video to load and "Gerar Reels" button to appear
    const generateBtn = page.getByRole('button', { name: /gerar reel/i });
    await generateBtn.waitFor({ state: 'visible', timeout: 15000 });

    console.log('Clicking "Modo Teste (Sem IA)"...');
    await page.getByRole('button', { name: /Modo Teste \(Sem IA\)/i }).click();

    console.log('Waiting for generation button to be enabled...');
    // Now wait for the analyze modal to disappear or just the generate button to be enabled
    await expect(generateBtn).toBeEnabled({ timeout: 10000 });

    // Wait for the rendering to finish and the save button to appear
    console.log('Clicking "Gerar Reels"...');
    await generateBtn.click();

    console.log('Waiting for rendering to finish (Salvar Reel button to appear)...');
    // The "Salvar Reel / Compartilhar" button appears when exportedBlob is set
    const saveBtn = page.getByRole('button', { name: /Salvar Reel/i });
    // Increase timeout since rendering can take a bit
    await saveBtn.waitFor({ state: 'visible', timeout: 90000 });

    console.log('Clicking "Salvar Reel" to trigger download...');
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await saveBtn.click();

    console.log('Waiting for download to complete...');
    const download = await downloadPromise;

    // Save downloaded file
    const downloadPath = path.join(__dirname, '../test_output.mp4');
    await download.saveAs(downloadPath);
    console.log('Downloaded file saved to', downloadPath);

    expect(fs.existsSync(downloadPath)).toBeTruthy();

    console.log('Running ffprobe to check for audio... ');
    // Check with ffprobe
    try {
        const ffprobeOut = execSync(`ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${downloadPath}"`);
        const audioCodec = ffprobeOut.toString().trim();
        console.log('Found audio codec:', audioCodec);
        expect(audioCodec).toBeTruthy();
        expect(audioCodec.length).toBeGreaterThan(0);
    } catch (error: any) {
        console.error('FFProbe failed or no audio stream found:', error?.stdout?.toString() || error?.message);
        throw new Error('No audio stream was found in the downloaded file!');
    }
});
