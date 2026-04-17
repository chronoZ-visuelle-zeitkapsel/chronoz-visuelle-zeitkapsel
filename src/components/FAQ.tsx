import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import './faq.css';

const TABLET_BREAKPOINT = 980;
const MAX_FAQS_COMPACT = 5;

interface FAQItemProps {
	question: string;
	answer: string;
	category: string;
	isOpen: boolean;
	onToggle: () => void;
}

function FAQItem({ question, answer, category, isOpen, onToggle }: FAQItemProps): ReactElement {
	return (
		<div className={`faq-item ${isOpen ? 'open' : ''}`}>
			<button 
				className="faq-question" 
				onClick={onToggle}
				aria-expanded={isOpen}
			>
				<span className="faq-question-text">
					<span className="faq-question-title">{question}</span>
				</span>
				<span className="faq-category" aria-label={`Kategorie ${category}`}>{category}</span>
				<span className="faq-icon">{isOpen ? '-' : '+'}</span>
			</button>
			{isOpen && (
				<div className="faq-answer">
					<p>{answer}</p>
				</div>
			)}
		</div>
	);
}

function FAQ(): ReactElement {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('Alle');
	const [openItemIndex, setOpenItemIndex] = useState<number | null>(null);
	const [isCompactViewport, setIsCompactViewport] = useState<boolean>(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT}px)`);
		const updateViewportState = (): void => {
			setIsCompactViewport(mediaQuery.matches);
		};

		updateViewportState();
		mediaQuery.addEventListener('change', updateViewportState);

		return () => {
			mediaQuery.removeEventListener('change', updateViewportState);
		};
	}, []);
	
	const faqData = useMemo(() => [
		{
			question: "Was ist ChronoZ?",
			answer: "ChronoZ ist eine digitale Zeitkapsel-Plattform, mit der Sie Erinnerungen und Postkarten digital erstellen, speichern, bearbeiten, löschen und als PDF exportieren können. So bewahren Sie besondere Momente sicher in Ihrer Chronik auf.",
			category: "Grundlagen"
		},
		{
			question: "Wie erstelle ich eine Postkarte?",
			answer: "Öffnen Sie die Chronik und klicken Sie unten rechts auf den '+'-Button. Danach können Sie Titel, Datum, Beschreibung und Bilder eintragen und die Postkarte mit 'Speichern' anlegen.",
			category: "Postkarten"
		},
		{
			question: "Wird meine Postkarte versendet?",
			answer: "Nein. ChronoZ versendet aktuell keine Postkarten automatisch. Ihre Postkarte wird in der Chronik gespeichert und kann dort bearbeitet, gelöscht oder als PDF exportiert werden.",
			category: "Archiv"
		},
		{
			question: "Muss ich mich registrieren?",
			answer: "Ja. Für das Erstellen und Verwalten eigener Postkarten benötigen Sie ein kostenloses Konto. Die Registrierung dauert nur wenige Sekunden und schaltet die Chronik-Funktionen frei.",
			category: "Konto"
		},
		{
			question: "Ist ChronoZ kostenlos?",
			answer: "Ja, ChronoZ ist komplett kostenlos. Sie können Postkarten erstellen, speichern, bearbeiten und als PDF exportieren, ohne dafür bezahlen zu müssen.",
			category: "Abonnement"
		},
		{
			question: "Kann ich eine Postkarte an mehrere Personen senden?",
			answer: "Eine direkte Versandfunktion gibt es aktuell nicht. Wenn Sie eine Postkarte weitergeben möchten, können Sie sie als PDF exportieren und anschließend selbst teilen.",
			category: "Versand"
		},
		{
			question: "Was passiert, wenn ich mein Passwort vergesse?",
			answer: "Kein Problem. Klicken Sie auf der Login-Seite auf 'Passwort vergessen?' und folgen Sie den Anweisungen. Sie erhalten anschließend eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts.",
			category: "Konto"
		},
		{
			question: "Kann ich eine bereits erstellte Postkarte bearbeiten oder löschen?",
			answer: "Ja. In der Chronik können Sie die aktuelle Postkarte über das Menü mit den drei Punkten bearbeiten oder löschen. Im Bearbeitungsmodus werden Titel, Datum, Text und Bilder übernommen.",
			category: "Postkarten"
		}
	], []);

	const categories = useMemo(() => (
		Array.from(new Set(faqData.map((faq) => faq.category)))
	), [faqData]);

	const categoryFilters = useMemo(() => (
		['Alle', ...categories]
	), [categories]);

	const filteredFaqs = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();
		return faqData.filter((faq) => {
			const matchesSearch = !normalizedQuery
				|| faq.question.toLowerCase().includes(normalizedQuery)
				|| faq.answer.toLowerCase().includes(normalizedQuery)
				|| faq.category.toLowerCase().includes(normalizedQuery);
			const matchesCategory = selectedCategory === 'Alle'
				|| faq.category === selectedCategory;
			return matchesSearch && matchesCategory;
		});
	}, [faqData, searchQuery, selectedCategory]);

	const visibleFaqs = useMemo(() => (
		isCompactViewport
			? filteredFaqs.slice(0, MAX_FAQS_COMPACT)
			: filteredFaqs
	), [filteredFaqs, isCompactViewport]);

	useEffect(() => {
		if (openItemIndex !== null && openItemIndex >= visibleFaqs.length) {
			setOpenItemIndex(null);
		}
	}, [openItemIndex, visibleFaqs.length]);

	function resetFilters(): void {
		setSearchQuery('');
		setSelectedCategory('Alle');
		setOpenItemIndex(null);
	}

	function toggleFaqItem(index: number): void {
		setOpenItemIndex((currentOpenIndex) => (currentOpenIndex === index ? null : index));
	}

	return (
		<section className="faq-section" id="faq">
			<div className="faq-container">
				<header className="faq-masthead">
					<h2 className="faq-title">FAQ</h2>
				</header>

				<div className="faq-toolbar">
					<label className="faq-search">
						<span className="faq-search-label">Suchmaschine</span>
						<div className="faq-search-field">
							<input
								className="faq-search-input"
								type="text"
								placeholder="Schnellfilter nach Stichworten ..."
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								aria-label="FAQ durchsuchen"
							/>
							<button
								type="button"
								className="faq-search-clear"
								onClick={() => setSearchQuery('')}
								aria-label="Suche löschen"
								disabled={!searchQuery}
							>
								x
							</button>
						</div>
					</label>
						<div className="faq-categories" aria-label="FAQ Kategorien">
							{categoryFilters.map((category) => (
								<button
									key={category}
									type="button"
									className={`faq-category-pill ${selectedCategory === category ? 'active' : ''}`}
									onClick={() => {
										setSelectedCategory(category);
										setOpenItemIndex(null);
									}}
									aria-pressed={selectedCategory === category}
								>
									{category}
								</button>
							))}
						</div>
				</div>

				<div className="faq-list" role="list">
					{visibleFaqs.map((faq, index) => (
						<FAQItem
							key={`${faq.question}-${index}`}
							question={faq.question}
							answer={faq.answer}
							category={faq.category}
							isOpen={openItemIndex === index}
							onToggle={() => toggleFaqItem(index)}
						/>
					))}
					{visibleFaqs.length === 0 && (
						<div className="faq-empty" role="status" aria-live="polite">
							<p>Keine passenden Fragen gefunden.</p>
							<button type="button" className="faq-reset-filters" onClick={resetFilters}>
								Alle Fragen anzeigen
							</button>
						</div>
					)}
				</div>

			</div>
		</section>
	);
}

export default FAQ;
