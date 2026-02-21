/* ==========================================================
   script.js — Le Domaine des Charmes
   ----------------------------------------------------------
   Sections :
   1. Navbar (scroll effect)
   2. Blog : Format des dates
   3. Blog : Masquage articles non publiés
   4. Blog : Pagination + Filtre catégories
   5. Blog : Modal article
   6. Reveal au scroll (animations)
   ========================================================== */

// ── 2. Blog : Format des dates ──────────────────────────────────
    const MONTHS_FR = ['janvier','février','mars','avril','mai','juin',
                       'juillet','août','septembre','octobre','novembre','décembre'];

    function formatDateFR(isoStr) {
      const [y, m, d] = isoStr.split('-').map(Number);
      return d + ' ' + MONTHS_FR[m - 1] + ' ' + y;
    }

    // Inject formatted dates into cards
    document.querySelectorAll('.blog-card').forEach(card => {
      const raw = card.dataset.date;
      if (raw) {
        const el = card.querySelector('.date-display');
        if (el) el.textContent = formatDateFR(raw);
      }
    });

    // ── 3. Blog : Masquage articles non publiés ───────────
    // Un article avec data-date dans le futur est masqué automatiquement.
    // Pour le tester : changez une data-date en date future (ex: 2099-01-01).
    const today = new Date();
    today.setHours(0, 0, 0, 0); // minuit aujourd'hui

    document.querySelectorAll('.blog-card[data-date]').forEach(card => {
      const parts = card.dataset.date.split('-').map(Number); // [YYYY, MM, DD]
      const pubDate = new Date(parts[0], parts[1] - 1, parts[2]); // local, pas UTC
      if (pubDate > today) {
        card.classList.add('blog-hidden');
        card.dataset.unpublished = 'true'; // marquer pour ne pas le réafficher via filtre
      }
    });

    // ── 4. Blog : Pagination + Filtre catégories ───────────────────────────────
    // Tri par date décroissante (plus récent en premier)
    const allCards = [...document.querySelectorAll('.blog-card')].sort((a, b) => {
      const dateA = a.dataset.date ? new Date(a.dataset.date) : new Date(0);
      const dateB = b.dataset.date ? new Date(b.dataset.date) : new Date(0);
      return dateB - dateA;
    });

    // Réinjecter les cartes dans le DOM dans le bon ordre
    const blogGrid = document.querySelector('.blog-grid');
    allCards.forEach(card => blogGrid.appendChild(card));

    // L'article le plus récent (premier après tri) prend automatiquement la classe featured.
    // Les autres la perdent, peu importe ce qui est écrit dans le HTML.
    allCards.forEach(card => card.classList.remove('featured'));
    const firstPublished = allCards.find(card => card.dataset.unpublished !== 'true');
    if (firstPublished) firstPublished.classList.add('featured');
    const filterBtns    = document.querySelectorAll('.filter-btn');
    const pagination    = document.getElementById('blogPagination');
    const pagPrev       = document.getElementById('pagPrev');
    const pagNext       = document.getElementById('pagNext');
    const pagNumbers    = document.getElementById('pagNumbers');
    const CARDS_PER_PAGE = 5;

    let currentFilter = 'all';
    let currentPage   = 1;

    // Retourne les cartes publiées correspondant au filtre actif
    function getVisibleCards() {
      return allCards.filter(card => {
        if (card.dataset.unpublished === 'true') return false;
        return currentFilter === 'all' || card.dataset.category === currentFilter;
      });
    }

    // Affiche la page demandée
    function renderPage(page, scroll) {
      const visible   = getVisibleCards();
      const totalPages = Math.ceil(visible.length / CARDS_PER_PAGE);
      currentPage     = Math.min(Math.max(1, page), Math.max(1, totalPages));

      const start = (currentPage - 1) * CARDS_PER_PAGE;
      const end   = start + CARDS_PER_PAGE;

      // Masquer / afficher les cartes
      allCards.forEach(card => {
        const idx = visible.indexOf(card);
        if (idx >= start && idx < end) {
          card.classList.remove('blog-hidden');
        } else {
          card.classList.add('blog-hidden');
        }
      });

      // Masquer les cartes non publiées et hors filtre toujours
      allCards.forEach(card => {
        if (card.dataset.unpublished === 'true') card.classList.add('blog-hidden');
        if (currentFilter !== 'all' && card.dataset.category !== currentFilter) {
          card.classList.add('blog-hidden');
        }
      });

      // Pagination UI
      if (totalPages <= 1) {
        pagination.classList.add('hidden');
      } else {
        pagination.classList.remove('hidden');
        pagPrev.disabled = currentPage === 1;
        pagNext.disabled = currentPage === totalPages;
        renderPageNumbers(totalPages);
      }

      // Remonter vers le haut de la grille d'articles au changement de page
      // On tient compte de la navbar fixe (hauteur ~70px) + une marge confortable
      if (scroll) {
        const blogGrid = document.querySelector('.blog-grid');
        if (blogGrid) {
          setTimeout(() => {
            const navbarHeight = document.getElementById('navbar').offsetHeight || 70;
            const targetY = blogGrid.getBoundingClientRect().top + window.scrollY - navbarHeight - 24;
            window.scrollTo({ top: targetY, behavior: 'smooth' });
          }, 50);
        }
      }
    }

    // Génère les numéros de page avec ellipses si > 5 pages
    function renderPageNumbers(total) {
      pagNumbers.innerHTML = '';

      let pages = [];
      if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        if (currentPage > 3)          pages.push('…');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(total - 1, currentPage + 1); i++) {
          pages.push(i);
        }
        if (currentPage < total - 2)  pages.push('…');
        pages.push(total);
      }

      pages.forEach(p => {
        if (p === '…') {
          const dots = document.createElement('span');
          dots.className = 'pag-dots';
          dots.textContent = '…';
          pagNumbers.appendChild(dots);
        } else {
          const btn = document.createElement('button');
          btn.className = 'pag-btn' + (p === currentPage ? ' active' : '');
          btn.textContent = p;
          btn.addEventListener('click', () => renderPage(p, true));
          pagNumbers.appendChild(btn);
        }
      });
    }

    // Flèches
    pagPrev.addEventListener('click', () => renderPage(currentPage - 1, true));
    pagNext.addEventListener('click', () => renderPage(currentPage + 1, true));

    // Filtre catégories
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderPage(1, false); // retour page 1 à chaque changement de filtre
      });
    });

    // Initialisation — sans scroll
    renderPage(1, false);
    // ── 5. Blog : Modal article ──────────────────────────────────────────
    const modal        = document.getElementById('blogModal');
    const modalClose   = document.getElementById('modalClose');
    const modalImg     = document.getElementById('modalImg');
    const modalCat     = document.getElementById('modalCat');
    const modalDate    = document.getElementById('modalDate');
    const modalTitle   = document.getElementById('modalTitle');
    const modalBody    = document.getElementById('modalBody');

    function openModal(card) {
      const img   = card.querySelector('.blog-img img');
      const badge = card.querySelector('.blog-cat-badge');
      modalImg.src        = img ? img.src : '';
      modalImg.alt        = img ? img.alt : '';
      modalCat.textContent  = badge ? badge.textContent : '';
      modalDate.textContent = card.dataset.date ? formatDateFR(card.dataset.date) : '';
      modalTitle.textContent = card.dataset.title || '';
      modalBody.innerHTML  = card.dataset.content || '';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Scroll modal to top
      document.getElementById('blogModalBox').scrollTop = 0;
    }

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.blog-card').forEach(card => {
      card.addEventListener('click', () => openModal(card));
    });
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // ── 0. Plateformes de réservation — masquage si tout désactivé ──
    // Si tous les boutons ont data-disabled="true", on masque aussi
    // le bloc .booking-platforms et le séparateur pour ne pas laisser
    // un titre "Réservation instantanée" flottant sans contenu.
    const platformsBlock = document.getElementById('bookingPlatforms');
    if (platformsBlock) {
      const activePlatforms = platformsBlock.querySelectorAll(
        '.platform-btn:not([data-disabled="true"])'
      );
      if (activePlatforms.length === 0) {
        platformsBlock.classList.add('all-disabled');
      }
    }

    // ── 1. Navbar — effet scroll ────────────────────────────────
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    });

    // ── 6. Reveal au scroll ────────────────────────────────────────
    const reveals = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const parent = entry.target.parentElement;
          const siblings = parent
            ? [...parent.querySelectorAll(':scope > .reveal')]
            : [entry.target];
          const idx = Math.max(0, siblings.indexOf(entry.target));
          setTimeout(() => entry.target.classList.add('visible'), idx * 120);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

      reveals.forEach(el => observer.observe(el));

    } else {
      // Fallback navigateurs anciens uniquement
      reveals.forEach(el => el.classList.add('visible'));
    }
