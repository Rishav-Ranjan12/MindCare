(function () {
  'use strict';
  const T = [
    { name: 'Dr. Sarah Johnson', specialty: 'Clinical Psychology', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face', bio: 'Specializing in anxiety, depression, and cognitive behavioral therapy with 12+ years of experience.', rating: 4.9, reviews: 156, badges: ['Licensed Psychologist', 'CBT Certified', 'Anxiety Specialist'], location: 'Downtown', phone: '+1 (555) 123-4567', email: 'sarah.johnson@mindcare.com' },
    { name: 'Dr. Michael Chen', specialty: 'Psychiatry', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face', bio: 'Board-certified psychiatrist focusing on mood disorders, ADHD, and medication management.', rating: 4.8, reviews: 203, badges: ['Board Certified', 'Mood Disorders', 'ADHD Expert'], location: 'Midtown', phone: '+1 (555) 234-5678', email: 'michael.chen@mindcare.com' },
    { name: 'Dr. Emily Rodriguez', specialty: 'Marriage & Family Therapy', image: 'https://images.unsplash.com/photo-1594824475407-45fb9de0db6f?w=300&h=300&fit=crop&crop=face', bio: 'Helping couples and families build stronger relationships through evidence-based approaches.', rating: 4.9, reviews: 189, badges: ['MFT Licensed', 'Couples Therapy', 'Family Systems'], location: 'Uptown', phone: '+1 (555) 345-6789', email: 'emily.rodriguez@mindcare.com' },
    { name: 'Dr. James Wilson', specialty: 'Addiction Counseling', image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face', bio: 'Certified addiction counselor with expertise in substance abuse recovery and dual diagnosis.', rating: 4.7, reviews: 167, badges: ['Addiction Certified', 'Recovery Expert', 'Dual Diagnosis'], location: 'Downtown', phone: '+1 (555) 456-7890', email: 'james.wilson@mindcare.com' },
    { name: 'Dr. Lisa Thompson', specialty: 'Trauma Therapy', image: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&h=300&fit=crop&crop=face', bio: 'EMDR-trained therapist specializing in PTSD, childhood trauma, and crisis intervention.', rating: 4.9, reviews: 234, badges: ['EMDR Certified', 'Trauma Specialist', 'PTSD Expert'], location: 'Online', phone: '+1 (555) 567-8901', email: 'lisa.thompson@mindcare.com' },
    { name: 'Dr. David Kim', specialty: 'Clinical Psychology', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face', bio: 'Cognitive-behavioral therapist focusing on OCD, social anxiety, and panic disorders.', rating: 4.8, reviews: 145, badges: ['CBT Expert', 'OCD Specialist', 'Anxiety Disorders'], location: 'Midtown', phone: '+1 (555) 678-9012', email: 'david.kim@mindcare.com' },
    { name: 'Dr. Rachel Martinez', specialty: 'Child Psychology', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&h=300&fit=crop&crop=face', bio: 'Pediatric psychologist specializing in developmental disorders, ADHD, and behavioral issues.', rating: 4.9, reviews: 198, badges: ['Child Specialist', 'Developmental Expert', 'Play Therapy'], location: 'Uptown', phone: '+1 (555) 789-0123', email: 'rachel.martinez@mindcare.com' },
    { name: 'Dr. Robert Taylor', specialty: 'Geriatric Psychology', image: 'https://images.unsplash.com/photo-1609972827720-c3720e8b2e30?w=300&h=300&fit=crop&crop=face', bio: 'Specializing in age-related mental health issues, dementia care, and late-life depression.', rating: 4.7, reviews: 112, badges: ['Geriatric Certified', 'Dementia Care', 'Senior Mental Health'], location: 'Downtown', phone: '+1 (555) 890-1234', email: 'robert.taylor@mindcare.com' }
  ];
  const COLS = ['#86a38c', '#cf6f45', '#e6b462', '#9fbfc4', '#d98b9a', '#7a8fb8'];

  MC.ready(function () {
    const $ = MC.$, esc = MC.esc;
    const grid = $('#therapist-grid'), q = $('#search-input'), sp = $('#specialty-filter'), lo = $('#location-filter');

    function render(list) {
      $('#result-count').textContent = list.length + (list.length === 1 ? ' therapist' : ' therapists') + ' found';
      if (!list.length) { grid.innerHTML = `<div class="empty">${MC.icon('search-x')}<h3>No therapists found</h3><p>Try adjusting your search criteria.</p></div>`; MC.icons(grid); return; }
      grid.innerHTML = list.map((t, i) => {
        const ini = t.name.replace('Dr. ', '').split(' ').map((w) => w[0]).join('');
        const c = COLS[T.indexOf(t) % COLS.length];
        const full = Math.floor(t.rating);
        return `<article class="t-card" data-reveal data-tilt="7" style="--c:${c};--d:${i % 3}">
          <div class="t-top"><div class="t-photo"><img src="${t.image}" alt="${esc(t.name)}" loading="lazy" onerror="this.outerHTML='<div class=&quot;ph&quot;>${ini}</div>'"></div>
            <div><h3>${esc(t.name)}</h3><div class="t-spec">${esc(t.specialty)}</div><span class="t-loc">${MC.icon('map-pin')}${esc(t.location === 'Online' ? 'Online sessions' : t.location)}</span></div></div>
          <p class="t-bio">${esc(t.bio)}</p>
          <div class="t-rate"><span class="stars" aria-hidden="true">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span>${t.rating} · ${t.reviews} reviews</div>
          <div class="t-badges">${t.badges.map((b) => `<span class="tag">${esc(b)}</span>`).join('')}</div>
          <div class="t-actions"><a class="btn btn-ghost btn-sm" href="mailto:${t.email}">${MC.icon('mail')}Email</a><a class="btn btn-sm" href="tel:${t.phone.replace(/[^+\d]/g, '')}">${MC.icon('phone')}Call</a></div>
        </article>`;
      }).join('');
      MC.icons(grid); MC.reveal(grid); MC.tilt(grid);
    }

    function filter() {
      const s = q.value.toLowerCase().trim();
      render(T.filter((t) => (!s || (t.name + ' ' + t.specialty + ' ' + t.bio + ' ' + t.badges.join(' ')).toLowerCase().includes(s)) && (!sp.value || t.specialty === sp.value) && (!lo.value || t.location === lo.value)));
    }
    [q, sp, lo].forEach((el) => el.addEventListener(el === q ? 'input' : 'change', filter));
    filter();
  });
})();
