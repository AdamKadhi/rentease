/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // new premium palette
        obsidian:   '#0D1117',
        charcoal:   '#1C2333',
        gold:       '#C9933A',
        'gold-light': '#E8B96A',
        parchment:  '#FAFAFA',
        cream:      '#FFFFFF',
        ink:        '#111111',
        muted:      '#888888',
        border:     '#E0E0E0',
        // keep for backward compat where still used
        navy:       '#0D1117',
        sand:       '#FAFAFA',
        terracotta: '#C9933A',
        slate:      '#888888',
      },
      fontFamily: {
        sans:     ['Poppins', 'sans-serif'],
        inter:    ['Poppins', 'sans-serif'],
        cairo:    ['Cairo', 'sans-serif'],
        playfair: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 1px 4px rgba(0,0,0,0.08), 0 4px 20px rgba(0,0,0,0.10)',
        'card-hover': '0 4px 10px rgba(0,0,0,0.10), 0 14px 36px rgba(0,0,0,0.14)',
        'glow':    '0 0 0 3px rgba(201,147,58,0.20)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      backgroundImage: {
        'sidebar-grad': 'linear-gradient(160deg, #0D1117 0%, #1C2333 100%)',
        'gold-grad':    'linear-gradient(135deg, #C9933A 0%, #E8B96A 100%)',
        'card-grad':    'linear-gradient(135deg, #FDFAF6 0%, #F5EEE4 100%)',
      },
    },
  },
  plugins: [],
};
