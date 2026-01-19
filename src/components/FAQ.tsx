import React, { ReactElement, useState } from 'react';
import './faq.css';

interface FAQItemProps {
	question: string;
	answer: string;
}

function FAQItem({ question, answer }: FAQItemProps): ReactElement {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="faq-item">
			<button 
				className="faq-question" 
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
			>
				<span>{question}</span>
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
	const faqData = [
		{
			question: "Was ist ChronoZ?",
			answer: "ChronoZ ist eine digitale Zeitkapsel-Plattform, mit der Sie Erinnerungen, Nachrichten und Postkarten erstellen und zu einem späteren Zeitpunkt versenden können. Bewahren Sie besondere Momente für die Zukunft auf!"
		},
		{
			question: "Wie erstelle ich eine Postkarte?",
			answer: "Klicken Sie auf den Button mit dem '+', wählen Sie ein Design, füllen Sie alle Felder aus und klicken Sie auf 'Erstellen'.Es ist ganz einfach!"
		},
		{
			question: "Wird meine Postkarte versendet?",
			answer: "Nein, Ihre Postkarte wird sicher in Ihrem Archiv gespeichert und nur Sie können diese sehen. Sie haben später die Möglichkeit, sie zu versenden."
		},
		{
			question: "Muss ich mich registrieren?",
			answer: "Ja, um eigene Postkarten zu erstellen und zu versenden, benötigen Sie ein kostenloses Konto. Die Registrierung dauert nur wenige Sekunden und ermöglicht es Ihnen, alle Ihre Zeitkapseln zu verwalten. Die Zeitkapsel der Generation Z ist bald ohne Registrierung auf der Startseite sichtbar."
		},
		{
			question: "Ist ChronoZ kostenlos?",
			answer: "Ja, ChronoZ ist komplett kostenlos! Sie können beliebig viele Postkarten erstellen und versenden, ohne dafür bezahlen zu müssen."
		},
		{
			question: "Kann ich eine Postkarte an mehrere Personen senden?",
			answer: "Aktuell noch nicht. Diese Funktion wird in näherer Zukunft verfügbar sein."
		},
		{
			question: "Was passiert, wenn ich mein Passwort vergesse?",
			answer: "Kein Problem! Klicken Sie auf der Login-Seite auf 'Passwort vergessen?' und folgen Sie den Anweisungen. Sie erhalten eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts."
		},
		{
			question: "Kann ich eine bereits erstellte Postkarte bearbeiten oder löschen?",
			answer: "Ja, in Ihrem Profil unter 'Meine Zeitkapsel' können Sie alle Ihre erstellten Postkarten sehen und diese bearbeiten oder löschen."
		}
	];

	return (
		<section className="faq-section">
			<div className="faq-container">
				<h2 className="faq-title">Häufig gestellte Fragen</h2>
				<p className="faq-subtitle">Hier finden Sie Antworten auf die wichtigsten Fragen zu ChronoZ</p>
				<div className="faq-list">
					{faqData.map((faq, index) => (
						<FAQItem key={index} question={faq.question} answer={faq.answer} />
					))}
				</div>
			</div>
		</section>
	);
}

export default FAQ;
