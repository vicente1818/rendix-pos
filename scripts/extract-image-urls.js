const fs = require('fs');
const base = 'C:/Users/vicen/.gemini/antigravity/brain/1997108e-7c25-43b3-94f8-5d97e3d18dcc/.system_generated/steps';
const files = {
  androt: '520', keto50: '521', ashwa: '522', b12: '523',
  evod_omega: '524', evod_lady: '525', evod_gran: '526',
  cafeina: '527', landerlan_api: '528'
};

for (const [name, num] of Object.entries(files)) {
  try {
    const c = fs.readFileSync(base + '/' + num + '/content.md', 'utf8');
    const m = c.match(/https?:\/\/elnegro\.com\.py\/wp-content\/uploads\/[^\s"')<>]+\.(jpg|jpeg|png|webp)/gi);
    const unique = [...new Set(m || [])].filter(u =>
      !u.includes('cropped-logo') && !u.includes('300x300') && !u.includes('150x150')
    ).slice(0, 3);
    console.log(name + ': ' + JSON.stringify(unique));
  } catch(e) {
    console.log(name + ': ERROR ' + e.message);
  }
}
