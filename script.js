const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuPanels = document.getElementById('mobileMenuPanels');
const mobileClose = document.getElementById('mobileClose');
const mobileBackBtn = document.getElementById('mobileBackBtn');
const subMenuTitle = document.getElementById('subMenuTitle');
const subMenuContent = document.getElementById('subMenuContent');
function openMenu() {
  mobileMenu.classList.add('active');
  if (menuToggle) menuToggle.classList.add('active');
  document.body.classList.add('menu-open');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  mobileMenu.classList.remove('active');
  if (menuToggle) menuToggle.classList.remove('active');
  document.body.classList.remove('menu-open');
  document.body.style.overflow = '';
  setTimeout(() => {
    mobileMenuPanels.classList.remove('showing-sub');
  }, 400);
}
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    if (mobileMenu.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });
}
if (mobileClose) mobileClose.addEventListener('click', closeMenu);
if (mobileBackBtn) {
  mobileBackBtn.addEventListener('click', () => {
    mobileMenuPanels.classList.remove('showing-sub');
  });
}
mobileMenu.addEventListener('click', (e) => {
  const parent = e.target.closest('.menu-item-parent');
  if (parent) {
    const wrapper = parent.closest('.menu-item-wrapper');
    const subMenuTemplate = wrapper.querySelector('.mobile-sub-menu');
    if (subMenuTemplate && subMenuContent) {
      subMenuTitle.textContent = parent.textContent.trim();
      subMenuContent.innerHTML = subMenuTemplate.innerHTML;
      mobileMenuPanels.classList.add('showing-sub');
      subMenuContent.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
      });
    }
  }
});
const animatedElements = document.querySelectorAll('[data-animate]');
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = parseInt(entry.target.dataset.delay) || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      animObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
animatedElements.forEach(el => animObserver.observe(el));
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 150;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + id) {
          link.classList.add('active');
        }
      });
    }
  });
}, { passive: true });
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const startTime = performance.now();
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }
  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(progress);
    const current = Math.floor(eased * target);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target.toLocaleString() + suffix;
    }
  }
  requestAnimationFrame(step);
}
const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
counters.forEach(el => counterObserver.observe(el));
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual && window.innerWidth > 768) {
  window.addEventListener('scroll', () => {
    const scroll = window.scrollY;
    if (scroll < window.innerHeight) {
      heroVisual.style.transform = `translateY(${scroll * 0.08}px)`;
    }
  }, { passive: true });
}
document.querySelectorAll('.service-card .btn-outline').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'var(--gold-50)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = '';
  });
});
document.addEventListener("DOMContentLoaded", function() {
  const mapElement = document.getElementById('branch-map');
  const branchItems = document.querySelectorAll('.branch-item');
  if (mapElement && typeof L !== 'undefined') {
    const map = L.map('branch-map', { 
      scrollWheelZoom: true,
      zoomControl: false,
      attributionControl: false
    }).setView([13.1, 100.95], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);
    const customIcon = L.icon({
      iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    const markers = [];
    branchItems.forEach((item, index) => {
      const lat = parseFloat(item.dataset.lat);
      const lng = parseFloat(item.dataset.lng);
      const zoom = parseInt(item.dataset.zoom) || 16;
      const detailsText = item.querySelector('.branch-item-details').innerHTML;
      const mapLink = item.querySelector('h3 a')?.href;
      const marker = L.marker([lat, lng], {icon: customIcon}).addTo(map)
        .bindPopup(`<div class="map-popup">${detailsText}</div>`);
      markers.push(marker);
      marker.on('click', () => {
        if (mapLink) {
          window.open(mapLink, '_blank');
        }
      });
      item.addEventListener('click', () => {
        branchItems.forEach(b => b.classList.remove('active'));
        item.classList.add('active');
        map.flyTo([lat, lng], zoom);
        setTimeout(() => marker.openPopup(), 400);
      });
    });
    const urlParams = new URLSearchParams(window.location.search);
    let initialBranch = 0;
    if (urlParams.has('branch')) {
      initialBranch = parseInt(urlParams.get('branch'));
      if (isNaN(initialBranch) || initialBranch < 0 || initialBranch >= branchItems.length) {
        initialBranch = 0;
      }
    }
    if (markers.length > 0) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
      if (initialBranch !== 0 && branchItems[initialBranch]) {
         setTimeout(() => {
           branchItems[initialBranch].click();
         }, 500); 
      } else {
         branchItems[0].classList.add('active');
      }
    }
    document.querySelectorAll('a[href="#branches"], a[href="index.html#branches"]').forEach(link => {
       link.addEventListener('click', () => {
         if(markers.length > 0 && mapElement.offsetParent !== null) {
            setTimeout(() => {
                branchItems[0].click();
            }, 600);
         }
       });
    });
  }
  document.querySelectorAll('.nav-branch-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
      if (isIndex && document.getElementById('branch-map')) {
        e.preventDefault();
        const branchIndex = parseInt(link.getAttribute('data-branch'));
        const target = document.querySelector('#branches');
        if (target) {
          const offset = 80;
          const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        const branchItems = document.querySelectorAll('.branch-item');
        if (branchItems[branchIndex]) {
          branchItems[branchIndex].click();
        }
        if (typeof closeMenu === 'function') {
           closeMenu();
        }
      }
    });
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const branchHoursElements = document.querySelectorAll('.branch-hours');
  function updateBranchStatus() {
    const now = new Date();
    const thailandTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    const currentHour = thailandTime.getHours();
    const currentMin = thailandTime.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;
    branchHoursElements.forEach(el => {
      const openTime = el.getAttribute('data-open');
      const closeTime = el.getAttribute('data-close');
      const badge = el.querySelector('.status-badge');
      if (openTime && closeTime && badge) {
        const [openH, openM] = openTime.split(':').map(Number);
        const [closeH, closeM] = closeTime.split(':').map(Number);
        const openTotalMin = openH * 60 + openM;
        const closeTotalMin = closeH * 60 + closeM;
        if (currentTotalMin >= openTotalMin && currentTotalMin < closeTotalMin) {
          const minutesUntilClose = closeTotalMin - currentTotalMin;
          if (minutesUntilClose <= 60) {
            badge.className = 'status-badge closing-soon';
            badge.textContent = '⚫ ใกล้ปิดให้บริการ';
          } else {
            badge.className = 'status-badge open';
            badge.textContent = '⚫ เปิดให้บริการ';
          }
        } else {
          badge.className = 'status-badge closed';
          badge.textContent = '⚫ ปิดให้บริการ';
        }
      }
    });
  }
  updateBranchStatus();
  setInterval(updateBranchStatus, 60000);
});
