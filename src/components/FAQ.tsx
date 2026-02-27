import React, { ReactElement, useMemo, useState } from 'react';
import './faq.css';

interface FAQItemProps {
	question: string;
	answer: string;
	category: string;
}

function FAQItem({ question, answer, category }: FAQItemProps): ReactElement {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className={`faq-item ${isOpen ? 'open' : ''}`}>
			<button 
				className="faq-question" 
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
			>
				<span className="faq-question-text">
					<span className="faq-question-title">{question}</span>
				</span>
				<span className="faq-category" aria-label={`Kategorie ${category}`}>{category}</span>
				<span className="faq-icon">{isOpen ? '−' : '+'}</span>
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
	
	const faqData = useMemo(() => [
		{
			question: "Was ist ChronoZ?",
			answer: "ChronoZ ist eine digitale Zeitkapsel-Plattform, mit der Sie Erinnerungen, Nachrichten und Postkarten erstellen und zu einem späteren Zeitpunkt versenden können. Bewahren Sie besondere Momente für die Zukunft auf!",
			category: "Grundlagen"
		},
		{
			question: "Wie erstelle ich eine Postkarte?",
			answer: "Klicken Sie auf den Button mit dem '+', wählen Sie ein Design, füllen Sie alle Felder aus und klicken Sie auf 'Erstellen'. Es ist ganz einfach!",
			category: "Postkarten"
		},
		{
			question: "Wird meine Postkarte versendet?",
			answer: "Nein, Ihre Postkarte wird sicher in Ihrem Archiv gespeichert und nur Sie können diese sehen. Sie haben später die Möglichkeit, sie zu versenden.",
			category: "Archiv"
		},
		{
			question: "Muss ich mich registrieren?",
			answer: "Ja, um eigene Postkarten zu erstellen und zu versenden, benötigen Sie ein kostenloses Konto. Die Registrierung dauert nur wenige Sekunden und ermöglicht es Ihnen, alle Ihre Zeitkapseln zu verwalten. Die Zeitkapsel der Generation Z ist bald ohne Registrierung auf der Startseite sichtbar.",
			category: "Konto"
		},
		{
			question: "Ist ChronoZ kostenlos?",
			answer: "Ja, ChronoZ ist komplett kostenlos! Sie können beliebig viele Postkarten erstellen und versenden, ohne dafür bezahlen zu müssen.",
			category: "Abonnement"
		},
		{
			question: "Kann ich eine Postkarte an mehrere Personen senden?",
			answer: "Aktuell noch nicht. Diese Funktion wird in näherer Zukunft verfügbar sein.",
			category: "Versand"
		},
		{
			question: "Was passiert, wenn ich mein Passwort vergesse?",
			answer: "Kein Problem! Klicken Sie auf der Login-Seite auf 'Passwort vergessen?' und folgen Sie den Anweisungen. Sie erhalten eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts.",
			category: "Konto"
		},
		{
			question: "Kann ich eine bereits erstellte Postkarte bearbeiten oder löschen?",
			answer: "Ja, in Ihrem Profil unter 'Meine Zeitkapsel' können Sie alle Ihre erstellten Postkarten sehen und diese bearbeiten oder löschen.",
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

	return (
		<section className="faq-section" id="faq">
			<div className="faq-container">
				<header className="faq-masthead">
					<h2 className="faq-title">FAQ</h2>
					<p className="faq-headline">Haben Sie eine Frage? Geben Sie sie am Archivschalter ab.</p>
				</header>

				<div className="faq-toolbar">
					<label className="faq-search">
						<span className="faq-search-label">Agenturticker</span>
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
								onClick={() => setSelectedCategory(category)}
								aria-pressed={selectedCategory === category}
							>
								{category}
							</button>
						))}
					</div>
				</div>

				<div className="faq-list" role="list">
					{(typeof window !== 'undefined' && (window.innerWidth <= 1024)
						? filteredFaqs.slice(0, 5)
						: filteredFaqs
					).map((faq, index) => (
						<FAQItem
							key={`${faq.question}-${index}`}
							question={faq.question}
							answer={faq.answer}
							category={faq.category}
						/>
					))}
				</div>

			</div>
		</section>
	);
}

export default FAQ;
