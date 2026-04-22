const fs = require('fs');

let content = fs.readFileSync('profile.html', 'utf8');

const socialHTML = `
                <div class="glass-card" id="socialCard" style="display: none;">
                    <h3 class="card-title"><i class="fas fa-link"></i> Social Media & Links</h3>
                    <div class="performer-types-grid" id="profileSocials" style="gap: 15px;"></div>
                </div>`;

// Insert after Focus & Categories card
if (!content.includes('id="socialCard"')) {
    content = content.replace('</div>\n            </div>\n\n            <div class="side-column">', '</div>\n' + socialHTML + '\n            </div>\n\n            <div class="side-column">');
}

const socialJS = `
                // Social Links
                const socialsGrid = document.getElementById('profileSocials');
                const socialCard = document.getElementById('socialCard');
                if (profile.social_links && profile.social_links.length > 0) {
                    socialCard.style.display = 'block';
                    const platformMap = {
                        'instagram': { icon: 'fab fa-instagram', color: '#E1306C' },
                        'facebook': { icon: 'fab fa-facebook', color: '#1877F2' },
                        'twitter': { icon: 'fab fa-twitter', color: '#1DA1F2' },
                        'youtube': { icon: 'fab fa-youtube', color: '#FF0000' },
                        'spotify': { icon: 'fab fa-spotify', color: '#1DB954' },
                        'soundcloud': { icon: 'fab fa-soundcloud', color: '#ff5500' },
                        'tiktok': { icon: 'fab fa-tiktok', color: '#fff' },
                        'website': { icon: 'fas fa-globe', color: '#6C63FF' }
                    };
                    
                    socialsGrid.innerHTML = profile.social_links.map(link => {
                        let purl = link.url;
                        if (!purl.startsWith('http')) purl = 'https://' + purl;
                        const iconData = platformMap[link.platform] || { icon: 'fas fa-link', color: '#6C63FF' };
                        return \`<a href="\${purl}" target="_blank" style="display:flex; align-items:center; justify-content:center; width:45px; height:45px; background:rgba(255,255,255,0.05); border-radius:50%; text-decoration:none; color:\${iconData.color}; font-size:1.3rem; transition:all 0.3s; border:1px solid rgba(255,255,255,0.1);" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(-3px)';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='none';"><i class="\${iconData.icon}"></i></a>\`;
                    }).join('');
                } else {
                    if (socialCard) socialCard.style.display = 'none';
                }
`;

if (!content.includes('const socialsGrid = document.getElementById')) {
    // Inject right after rendering types/specialties
    content = content.replace("typesGrid.innerHTML = `<p style=\"color:#8892b0\">Professional ${currentProfileType} verified.</p>`; \n                }", "typesGrid.innerHTML = `<p style=\"color:#8892b0\">Professional ${currentProfileType} verified.</p>`; \n                }\n\n" + socialJS);
}

fs.writeFileSync('profile.html', content, 'utf8');
console.log("Profile updated with Social Links!");
