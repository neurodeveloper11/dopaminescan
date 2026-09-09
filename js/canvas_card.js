/**
 * High-Definition 1080x1920 (9:16) Canvas Story Card Generator for DopamineScan.
 * 
 * Generates an ultra-crisp poster formatted for Instagram Stories, TikTok, and WhatsApp Status.
 * 100% Neutral viral copy: zero self-promotion, 100% focused on the challenge and user archetype.
 */

const CanvasCardGenerator = {
    render(result, canvas) {
        if (!canvas) {
            canvas = document.createElement('canvas');
        }
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');

        const W = 1080;
        const H = 1920;
        const arch = result.archetype;
        const accentColor = arch.color || "#10b981";

        // 1. Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#070a12');
        bgGrad.addColorStop(0.5, '#0b1120');
        bgGrad.addColorStop(1, '#05070e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // 2. Subtle Tech Grid & Radial Glow
        ctx.save();
        const radialGlow = ctx.createRadialGradient(W / 2, 680, 50, W / 2, 680, 520);
        radialGlow.addColorStop(0, accentColor + '25');
        radialGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1.5;
        for (let x = 60; x < W; x += 120) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 60; y < H; y += 120) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
        ctx.restore();

        // 3. Top Header
        ctx.fillStyle = '#64748b';
        ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '6px';
        ctx.fillText('NEUROCOGNITIVE TELEMETRY REPORT', W / 2, 140);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText('DOPAMINESCAN // 60s', W / 2, 220);

        // Subtitle pill
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        this.roundRect(ctx, W / 2 - 240, 260, 480, 48, 24, true, false);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillText('PVT • GO/NO-GO • MEMORY SPAN', W / 2, 292);

        // 4. Central Dial (Dopamine Saturation Index)
        const centerX = W / 2;
        const centerY = 650;
        const radius = 220;

        // Background track
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 0.8, Math.PI * 2.2, false);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 26;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Active Arc
        const startAngle = Math.PI * 0.8;
        const totalAngle = Math.PI * 1.4;
        const progressAngle = startAngle + (totalAngle * (result.dsi / 100));

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, progressAngle, false);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 26;
        ctx.lineCap = 'round';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 35;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Inner Circle & Number
        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 130px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(result.dsi + '%', centerX, centerY + 20);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText('DOPAMINE SATURATION', centerX, centerY + 70);

        // 5. Archetype Banner
        const bannerY = 960;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        this.roundRect(ctx, 100, bannerY, W - 200, 160, 24, true, true);

        ctx.font = '70px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(arch.emoji, 140, bannerY + 105);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.letterSpacing = '0px';
        ctx.fillText(arch.name.toUpperCase(), 240, bannerY + 80);

        ctx.fillStyle = accentColor;
        ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText('ARQUETIPO COGNITIVO // ' + arch.badge.toUpperCase(), 240, bannerY + 122);

        // 6. 2x2 Telemetry Cards
        const cardY = 1170;
        const cardW = 410;
        const cardH = 170;

        // Card 1: Attention Half-Life
        this.drawMetricCard(
            ctx, 100, cardY, cardW, cardH,
            'VIDA MEDIA ATENCIÓN', result.attentionHalfLife + ' min',
            'Enfoque continuo antes de distracción', '#06b6d4'
        );

        // Card 2: Reaction Speed
        this.drawMetricCard(
            ctx, 570, cardY, cardW, cardH,
            'REFLEJOS PSICOMOTORES', result.pvtMeanRt + ' ms',
            'Latencia real en milisegundos', '#10b981'
        );

        // Card 3: Inhibitory Brake
        this.drawMetricCard(
            ctx, 100, cardY + 200, cardW, cardH,
            'FRENO INHIBITORIO', result.gonogoDPrime + ' d\'',
            'Freno contra scroll compulsivo', '#f59e0b'
        );

        // Card 4: Global Rank
        this.drawMetricCard(
            ctx, 570, cardY + 200, cardW, cardH,
            'PERCENTIL POBLACIONAL', 'Top ' + (100 - result.percentile) + '%',
            'Rendimiento frente a la media', '#8b5cf6'
        );

        // 7. Neutral Viral Challenge Banner
        const challengeY = 1600;
        const gradChallenge = ctx.createLinearGradient(100, challengeY, W - 100, challengeY);
        gradChallenge.addColorStop(0, 'rgba(30, 41, 59, 0.95)');
        gradChallenge.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
        ctx.fillStyle = gradChallenge;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, 100, challengeY, W - 200, 180, 24, true, true);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ¿PUEDES SUPERAR MI ENFOQUE?', W / 2, challengeY + 68);

        ctx.fillStyle = accentColor;
        ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillText('neurodeveloper11.github.io/dopaminescan', W / 2, challengeY + 120);

        // 8. Discreet Scientific Footer
        ctx.fillStyle = '#475569';
        ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText('ENGINEERED UNDER COGNITIVE SCIENCE STANDARDS • MIT OPEN SOURCE', W / 2, 1850);

        return canvas;
    },

    drawMetricCard(ctx, x, y, w, h, label, value, sub, color) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, x, y, w, h, 18, true, true);

        // Accent top bar
        ctx.fillStyle = color;
        this.roundRect(ctx, x + 20, y + 16, 32, 4, 2, true, false);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.letterSpacing = '1.5px';
        ctx.fillText(label, x + 24, y + 52);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(value, x + 24, y + 110);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(sub, x + 24, y + 144);
    },

    roundRect(ctx, x, y, w, h, r, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    },

    getChallengeText(result) {
        const arch = result.archetype;
        return `Mi nivel de Dopamine Saturation es ${result.dsi}% (${arch.name} ${arch.emoji}). Mi vida media de atención es de ${result.attentionHalfLife} minutos. ¿Cómo está tu atención hoy? Haz el test de 60s aquí 👉 https://neurodeveloper11.github.io/dopaminescan`;
    },

    download(result) {
        const canvas = this.render(result);
        const link = document.createElement('a');
        link.download = `dopaminescan-${result.archetype.key}-${result.dsi}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    },

    async share(result) {
        const shareText = this.getChallengeText(result);
        const shareUrl = "https://neurodeveloper11.github.io/dopaminescan";

        if (navigator.share) {
            try {
                const canvas = this.render(result);
                canvas.toBlob(async (blob) => {
                    if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'dopaminescan.png', { type: 'image/png' })] })) {
                        const file = new File([blob], 'dopaminescan.png', { type: 'image/png' });
                        await navigator.share({
                            title: 'DopamineScan 60s Test',
                            text: shareText,
                            files: [file],
                        });
                    } else {
                        await navigator.share({
                            title: 'DopamineScan 60s Test',
                            text: shareText,
                            url: shareUrl,
                        });
                    }
                });
                return;
            } catch (err) {
                // User cancelled or share fallback
            }
        }

        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
            alert("¡Texto del reto copiado al portapapeles! Pégalo en tu WhatsApp, Story o red social.");
        } catch (e) {
            prompt("Copia tu texto del reto:", shareText);
        }
    }
};

window.CanvasCardGenerator = CanvasCardGenerator;
