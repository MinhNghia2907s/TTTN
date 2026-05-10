import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../../components/SectionHeading.jsx';
import TourCard from '../../components/TourCard.jsx';
import { getFeaturedTours, getTestimonials } from '../../services/user/tourService.js';
import { formatCurrency } from '../../utils/formatters.js';

const fallbackSlides = [
  {
    id: 'tour-sapa',
    title: 'Sa Pa Mùa Mây',
    location: 'Lào Cai',
    duration: '3 ngày 2 đêm',
    price: 4290000,
    rating: 4.9,
    reviewCount: 148,
    image:
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=80',
    description: 'Một hành trình săn mây đầy cảm hứng, rất hợp để đổi gió và mang về những khung hình thật đáng nhớ.',
  },
  {
    id: 'tour-danang',
    title: 'Đà Nẵng - Hội An Rực Nắng',
    location: 'Miền Trung',
    duration: '4 ngày 3 đêm',
    price: 5890000,
    rating: 4.8,
    reviewCount: 203,
    image:
      'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1400&q=80',
    description: 'Sự kết hợp vừa đủ giữa biển xanh, phố cổ và nhịp nghỉ dưỡng nhẹ nhàng cho một kỳ nghỉ trọn vẹn.',
  },
  {
    id: 'tour-phuquoc',
    title: 'Phú Quốc Sunset Escape',
    location: 'Kiên Giang',
    duration: '3 ngày 2 đêm',
    price: 6790000,
    rating: 4.9,
    reviewCount: 187,
    image:
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80',
    description: 'Không khí nghỉ dưỡng sang trọng, biển xanh trong và hoàng hôn đẹp để chuyến đi trở nên thật đáng mong chờ.',
  },
];

const spotlightThemes = [
  {
    badge: 'Lựa chọn nổi bật mùa này',
    ribbon: 'Tour được xem nhiều trong tuần',
    mood: 'Đẹp ở từng điểm dừng, dễ khiến người xem muốn chốt lịch ngay sau khi lướt qua.',
    proof: '3.2k lượt lưu tour trong tuần',
  },
  {
    badge: 'Lịch khởi hành được quan tâm nhiều',
    ribbon: 'Phù hợp cặp đôi và gia đình',
    mood: 'Lịch trình cân bằng giữa trải nghiệm và nghỉ ngơi để chuyến đi luôn dễ chốt hơn.',
    proof: 'Tỷ lệ đặt tour tăng 28%',
  },
  {
    badge: 'Tour nghỉ dưỡng được hỏi nhiều',
    ribbon: 'Lựa chọn lý tưởng để thư giãn',
    mood: 'Một chuyến đi gọn gàng nhưng đủ sang và đủ thư thái để khách muốn giữ chỗ sớm.',
    proof: '9/10 khách xem lại sau khi ghé',
  },
];

const travelGallery = [
  {
    id: 'gallery-1',
    title: 'Biển xanh buổi sớm',
    subtitle: 'Không gian mở đầu hoàn hảo cho một kỳ nghỉ đáng nhớ',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'gallery-2',
    title: 'Check-in trên đèo',
    subtitle: 'Gợi cảm giác khám phá và rất hợp cho tour trải nghiệm',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'gallery-3',
    title: 'Phố cổ lên đèn',
    subtitle: 'Lãng mạn, dễ chạm cảm xúc và rất hợp tour nghỉ ngắn ngày',
    image:
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'gallery-4',
    title: 'Resort sát biển',
    subtitle: 'Hình ảnh tạo cảm giác nghỉ dưỡng cao cấp ngay từ ánh nhìn đầu',
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'gallery-5',
    title: 'Bình minh giữa núi',
    subtitle: 'Mang lại cảm hứng đặt tour cho những hành trình thiên nhiên',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'gallery-6',
    title: 'Team đi cùng nhau',
    subtitle: 'Tạo cảm giác chuyến đi trọn niềm vui và nhiều kết nối hơn',
    image:
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
  },
];

const fallbackTestimonials = [
  {
    id: 'review-fallback-1',
    name: 'Minh Anh',
    role: 'Cặp đôi nghỉ dưỡng cuối tuần',
    content:
      'Lúc xem ảnh và lịch trình mình đã muốn đi ngay. Đến khi trải nghiệm thật thì mọi khoảnh khắc từ khách sạn, điểm tham quan đến lịch di chuyển đều rất vừa vặn.',
  },
  {
    id: 'review-fallback-2',
    name: 'Gia Huy',
    role: 'Nhóm bạn săn trải nghiệm',
    content:
      'Trang tour trình bày rõ nên tụi mình chọn được lịch rất nhanh. Chuyến đi thực tế cũng đúng cảm giác đã thấy từ đầu: nhiều cảm hứng, nhiều ảnh đẹp và rất đáng để quay lại.',
  },
  {
    id: 'review-fallback-3',
    name: 'Thu Trang',
    role: 'Gia đình có trẻ nhỏ',
    content:
      'Điều mình thích nhất là cảm giác yên tâm trước khi đặt tour. Khi đi rồi mới thấy mọi chi tiết được chuẩn bị đủ kỹ để cả nhà tận hưởng chuyến đi một cách nhẹ nhàng hơn.',
  },
];

const testimonialAccents = [
  {
    accent: 'Biển xanh và hoàng hôn',
    journey: 'Hành trình được lưu lại nhiều khoảnh khắc đẹp',
  },
  {
    accent: 'Lịch trình dễ theo dõi',
    journey: 'Trải nghiệm rõ ràng từ lúc xem tour đến lúc lên đường',
  },
  {
    accent: 'Nhiều kết nối đáng nhớ',
    journey: 'Một chuyến đi khiến người tham gia muốn chia sẻ lại',
  },
];

/**
 * Trang chủ landing page, tập trung vào hero slideshow và các khối nội dung dẫn người dùng sang đặt tour.
 */
function HomePage() {
  const [featuredTours, setFeaturedTours] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [previousSlideIndex, setPreviousSlideIndex] = useState(null);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(4);
  const [isTestimonialResetting, setIsTestimonialResetting] = useState(false);

  useEffect(() => {
    /**
     * Nạp tour nổi bật và testimonial song song để hero và các section bên dưới lên cùng lúc.
     */
    async function loadPage() {
      try {
        const [tourData, testimonialData] = await Promise.all([getFeaturedTours(), getTestimonials()]);
        setFeaturedTours(tourData);
        setTestimonials(testimonialData);
      } catch (error) {
        setFeaturedTours([]);
        setTestimonials([]);
      }
    }

    loadPage();
  }, []);

  // Nếu API mock chưa trả tour nổi bật thì dùng fallback để hero luôn có nội dung hiển thị.
  const heroSlides = useMemo(() => {
    const sourceSlides = featuredTours.length ? featuredTours : fallbackSlides;

    // Ghép thêm lớp nội dung marketing vào từng tour để hero có badge, ribbon và proof riêng.
    return sourceSlides.map((tour, index) => ({
      ...tour,
      ...spotlightThemes[index % spotlightThemes.length],
    }));
  }, [featuredTours]);

  useEffect(() => {
    if (!heroSlides.length) {
      return undefined;
    }

    // Tự động chuyển slide theo chu kỳ để hero luôn có cảm giác động như landing page quảng bá.
    const intervalId = window.setInterval(() => {
      setActiveSlideIndex((current) => {
        setPreviousSlideIndex(current);
        return (current + 1) % heroSlides.length;
      });
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [heroSlides]);

  useEffect(() => {
    if (!heroSlides.length) {
      setActiveSlideIndex(0);
      return;
    }

    // Khi số lượng slide thay đổi, đưa index hiện tại về phạm vi hợp lệ để tránh lỗi truy cập mảng.
    setActiveSlideIndex((current) => current % heroSlides.length);
  }, [heroSlides.length]);

  const activeSlide = heroSlides[activeSlideIndex] ?? heroSlides[0];
  const reviewSource = testimonials.length ? testimonials : fallbackTestimonials;
  const testimonialSlides = useMemo(() => {
    const sourceTestimonials =
      reviewSource.length >= 4
        ? reviewSource
        : [
            ...reviewSource,
            ...fallbackTestimonials.filter(
              (fallbackItem) => !reviewSource.some((item) => item.id === fallbackItem.id),
            ),
          ];

    return sourceTestimonials.map((item, index) => ({
      ...item,
      ...testimonialAccents[index % testimonialAccents.length],
      initials: item.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    }));
  }, [reviewSource]);

  const testimonialCloneCount = 4;
  const testimonialLoopSlides = useMemo(() => {
    if (!testimonialSlides.length) {
      return [];
    }

    return [
      ...testimonialSlides.slice(-testimonialCloneCount),
      ...testimonialSlides,
      ...testimonialSlides.slice(0, testimonialCloneCount),
    ];
  }, [testimonialSlides]);

  const activeTestimonialAccent =
    testimonialSlides[
      ((activeTestimonialIndex - testimonialCloneCount) % testimonialSlides.length +
        testimonialSlides.length) %
        testimonialSlides.length
    ];
  const normalizedTestimonialIndex =
    ((activeTestimonialIndex - testimonialCloneCount) % testimonialSlides.length + testimonialSlides.length) %
    testimonialSlides.length;

  useEffect(() => {
    if (!testimonialSlides.length) {
      setActiveTestimonialIndex(testimonialCloneCount);
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveTestimonialIndex((current) => current + 1);
    }, 5600);

    return () => window.clearInterval(intervalId);
  }, [testimonialCloneCount, testimonialSlides.length]);

  useEffect(() => {
    if (!testimonialSlides.length) {
      return;
    }

    setActiveTestimonialIndex(testimonialCloneCount);
  }, [testimonialCloneCount, testimonialSlides.length]);

  useEffect(() => {
    if (!testimonialSlides.length) {
      return undefined;
    }

    let timeoutId;

    if (activeTestimonialIndex >= testimonialSlides.length + testimonialCloneCount) {
      timeoutId = window.setTimeout(() => {
        setIsTestimonialResetting(true);
        setActiveTestimonialIndex(testimonialCloneCount);

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setIsTestimonialResetting(false);
          });
        });
      }, 760);
    }

    if (activeTestimonialIndex <= testimonialCloneCount - 1) {
      timeoutId = window.setTimeout(() => {
        setIsTestimonialResetting(true);
        setActiveTestimonialIndex(testimonialSlides.length + testimonialCloneCount - 1);

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setIsTestimonialResetting(false);
          });
        });
      }, 760);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeTestimonialIndex, testimonialCloneCount, testimonialSlides.length]);

  /**
   * Cho phép người dùng chọn trực tiếp một slide qua dot hoặc thumbnail.
   */
  function handleSelectSlide(index) {
    setPreviousSlideIndex(activeSlideIndex);
    setActiveSlideIndex(index);
  }

  /**
   * Chuyển sang slide kế tiếp và lưu lại slide trước đó để chạy animation rời khung.
   */
  function handleNextSlide() {
    setActiveSlideIndex((current) => {
      setPreviousSlideIndex(current);
      return (current + 1) % heroSlides.length;
    });
  }

  /**
   * Quay về slide trước đó để hỗ trợ điều hướng bằng nút mũi tên.
   */
  function handlePrevSlide() {
    setActiveSlideIndex((current) => {
      setPreviousSlideIndex(current);
      return (current - 1 + heroSlides.length) % heroSlides.length;
    });
  }

  /**
   * Chuyển sang bình luận kế tiếp để người xem chủ động duyệt các cảm nhận nổi bật.
   */
  function handleNextTestimonial() {
    setActiveTestimonialIndex((current) => current + 1);
  }

  /**
   * Quay lại bình luận trước đó bằng nút mũi tên trái.
   */
  function handlePrevTestimonial() {
    setActiveTestimonialIndex((current) => current - 1);
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-campaign-panel">
        <div className="container hero-stage">
          <div className="hero-copy-panel" key={activeSlide?.id}>
            <p className="section-eyebrow hero-eyebrow">Điểm đến được tìm kiếm nhiều</p>
            <span className="hero-kicker-pill">{activeSlide?.ribbon}</span>
            <h1 className="hero-display">
              <span>Đi nhiều hơn,</span>
              <span className="title-accent">sống rực hơn</span>
              <span>cùng {activeSlide?.title}</span>
            </h1>
            <p className="hero-copy hero-copy-animated">
              {activeSlide?.description} {activeSlide?.mood}
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/tours">
                Khám phá tour ngay
              </Link>
              <Link className="button button-secondary" to={`/tours/${activeSlide?.id ?? 'tour-sapa'}`}>
                Đặt tour nổi bật
              </Link>
            </div>
            <div className="hero-metrics hero-metrics-rich">
              <div className="metric-card">
                <span>Giá ưu tiên hiển thị</span>
                <strong>{formatCurrency(activeSlide?.price ?? 0)}</strong>
              </div>
              <div className="metric-card">
                <span>Đánh giá từ khách đi tour</span>
                <strong>
                  {activeSlide?.rating}/5 · {activeSlide?.reviewCount} lượt
                </strong>
              </div>
              <div className="metric-card">
                <span>Thời lượng phổ biến</span>
                <strong>{activeSlide?.duration}</strong>
              </div>
            </div>
            <div className="hero-ribbon">
              <div className="hero-ribbon-track">
                <span>Ưu tiên tour đẹp và dễ chốt</span>
                <span>Giá tour rõ ràng</span>
                <span>Hình ảnh truyền cảm hứng</span>
                <span>Lịch khởi hành dễ chọn</span>
                <span>Nút đặt tour nổi bật</span>
                <span>Ưu tiên tour đẹp và dễ chốt</span>
                <span>Giá tour rõ ràng</span>
                <span>Hình ảnh truyền cảm hứng</span>
                <span>Lịch khởi hành dễ chọn</span>
                <span>Nút đặt tour nổi bật</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-column">
            <div className="hero-slider-shell">
              {/* Mỗi slide được render thành một layer riêng để tránh lộ ảnh kế bên khi animation chạy. */}
              {heroSlides.map((slide, index) => {
                let slideState = 'next';

                if (index === activeSlideIndex) {
                  slideState = 'active';
                } else if (index === previousSlideIndex) {
                  slideState = 'previous';
                }

                return (
                  <article className={`hero-slider-card hero-slide-layer ${slideState}`} key={slide.id}>
                    <img alt={slide.title} className="hero-slider-image" src={slide.image} />
                    <div className="hero-slider-overlay" />
                    <div className="hero-slide-content">
                      <p>{slide.badge}</p>
                      <h3>{slide.title}</h3>
                      <p>{slide.description}</p>
                      <div className="hero-slide-meta">
                        <span>{slide.duration}</span>
                        <span>{formatCurrency(slide.price)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}

              <div className="hero-floating-note hero-floating-note-top">
                <span>{activeSlide?.badge}</span>
                <strong>{activeSlide?.proof}</strong>
              </div>
              <div className="hero-floating-note hero-floating-note-bottom">
                <span>Điểm đến nổi bật</span>
                <strong>{activeSlide?.location}</strong>
              </div>

              <div className="hero-slider-controls">
                <button aria-label="Tour trước" className="hero-control-button" type="button" onClick={handlePrevSlide}>
                  &#8249;
                </button>
                <div className="hero-control-dots">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.id}
                      aria-label={`Chọn slide ${index + 1}`}
                      className={index === activeSlideIndex ? 'hero-dot active' : 'hero-dot'}
                      type="button"
                      onClick={() => handleSelectSlide(index)}
                    />
                  ))}
                </div>
                <button aria-label="Tour tiếp theo" className="hero-control-button" type="button" onClick={handleNextSlide}>
                  &#8250;
                </button>
              </div>
            </div>

            <div className="hero-thumb-grid">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  className={index === activeSlideIndex ? 'hero-thumb-card active' : 'hero-thumb-card'}
                  type="button"
                  onClick={() => handleSelectSlide(index)}
                >
                  <img alt={slide.title} src={slide.image} />
                  <div>
                    <strong>{slide.title}</strong>
                    <span>{slide.location}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container section-block visual-story-strip">
        <div className="story-heading">
          <p className="section-eyebrow">Cảm hứng cho chuyến đi tiếp theo</p>
          <h2>Khám phá những hành trình tuyển chọn, sẵn sàng để bạn chọn ngày và đặt tour.</h2>
        </div>
        <div className="travel-gallery-grid">
          {travelGallery.map((item, index) => (
            <article className="travel-gallery-card" key={item.id}>
              <img alt={item.title} className="travel-gallery-image" src={item.image} />
              <div className="travel-gallery-overlay" />
              <div className="travel-gallery-content">
                <span>{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container section-block">
        <SectionHeading
          eyebrow="Tour nổi bật"
          title="Những hành trình nổi bật dành cho khách đang muốn chốt tour sớm"
          description="Mỗi tour được trình bày rõ ràng từ hình ảnh, giá, thời lượng đến nút xem chi tiết để khách dễ chọn và đặt tour nhanh hơn."
          action={
            <Link className="button button-ghost" to="/tours">
              Xem toàn bộ tour
            </Link>
          }
        />

        <div className="card-grid">
          {featuredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>

      <section className="container section-block experience-strip">
        <div>
          <p className="section-eyebrow">Hành trình đặt tour rõ ràng</p>
          <h2>Từ cảm hứng du lịch đến bước đặt tour, mọi thao tác đều được dẫn dắt rõ và tự nhiên.</h2>
        </div>
        <div className="step-grid">
          <article className="step-card">
            <strong>01</strong>
            <h3>Khám phá điểm đến</h3>
            <p>Ảnh lớn và headline nổi bật giúp khách nhanh chóng bị thu hút vào từng hành trình.</p>
          </article>
          <article className="step-card">
            <strong>02</strong>
            <h3>Chọn lịch phù hợp</h3>
            <p>Ngày khởi hành, thời lượng và mức giá được hiển thị rõ để khách dễ so sánh và ra quyết định.</p>
          </article>
          <article className="step-card">
            <strong>03</strong>
            <h3>Đặt tour nhanh</h3>
            <p>Biểu mẫu ngắn gọn và nút CTA rõ ràng giúp khách chuyển từ xem tour sang giữ chỗ nhanh hơn.</p>
          </article>
          <article className="step-card">
            <strong>04</strong>
            <h3>Theo dõi booking</h3>
            <p>Khách có thể xem lại lịch sử đặt tour trong cùng một giao diện thống nhất và dễ sử dụng.</p>
          </article>
        </div>
      </section>

      <section className="container section-block">
        <SectionHeading
          eyebrow="Trải nghiệm nổi bật"
          title="Những cảm hứng du lịch được kể lại từ người đã đi, để bạn dễ tìm thấy chuyến đi mình muốn bắt đầu"
          description="Từ khoảnh khắc biển xanh, phố lên đèn đến những hành trình nhiều kết nối, mỗi trải nghiệm đều gợi cảm giác rất thật để người xem muốn mở tour, xem kỹ hơn và sẵn sàng giữ chỗ."
        />

        <div className="testimonial-carousel">
          <div className="testimonial-carousel-head">
            <div className="testimonial-carousel-copy">
              <span>Cảm nhận thật từ người đã tham gia</span>
              <strong>{activeTestimonialAccent?.accent}</strong>
            </div>
          </div>

          <div className="testimonial-stage">
            <button
              aria-label="Xem bình luận trước"
              className="testimonial-control-button testimonial-control-button-left"
              type="button"
              onClick={handlePrevTestimonial}
            >
              &#8249;
            </button>

            <button
              aria-label="Xem bình luận tiếp theo"
              className="testimonial-control-button testimonial-control-button-right"
              type="button"
              onClick={handleNextTestimonial}
            >
              &#8250;
            </button>

            <div
              className={isTestimonialResetting ? 'testimonial-track no-transition' : 'testimonial-track'}
              style={{
                transform: `translateX(calc(-${activeTestimonialIndex} * (((100% - (var(--testimonial-visible) - 1) * var(--testimonial-gap)) / var(--testimonial-visible)) + var(--testimonial-gap))))`,
              }}
            >
              {testimonialLoopSlides.map((item, index) => (
                <article className="testimonial-card testimonial-slide" key={`${item.id}-${index}`}>
                  <div className="testimonial-card-top">
                    <span className="testimonial-quote-mark">"</span>
                    <div className="testimonial-stars" aria-label="5 sao">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                  </div>

                  <p className="testimonial-copy">{item.content}</p>

                  <div className="testimonial-highlight">
                    <strong>{item.accent}</strong>
                    <span>{item.journey}</span>
                  </div>

                  <div className="testimonial-author">
                    <div className="testimonial-avatar" aria-hidden="true">
                      {item.initials}
                    </div>
                    <div className="testimonial-author-meta">
                      <strong>{item.name}</strong>
                      <span>{item.role}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="testimonial-dots">
            {testimonialSlides.map((item, index) => (
              <button
                key={item.id}
                aria-label={`Xem bình luận ${index + 1}`}
                className={index === normalizedTestimonialIndex ? 'testimonial-dot active' : 'testimonial-dot'}
                type="button"
                onClick={() => setActiveTestimonialIndex(index + testimonialCloneCount)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;

