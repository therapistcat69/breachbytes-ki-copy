"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import './ChallengePage.css';

// Define the structure for a challenge
interface Challenge {
  domain: string;
  title: string;
  questionType: 'text' | 'image';
  questionContent: string;
  maxTries: number;
  attachment: string | null;
}

const ChallengePage = ({ params }: { params: { id: string } }) => {
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [triesLeft, setTriesLeft] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const challengeId = params.id;

  // Fetch challenge data when the component mounts
  useEffect(() => {
    fetch('/Data.json') 
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch Data.json. Please check the filename in your public folder.');
        }
        return res.json();
      })
      .then(data => {
        const specificChallenge = data.challenges[challengeId];
        if (specificChallenge) {
          setChallenge(specificChallenge);
          setTriesLeft(specificChallenge.maxTries);
        } else {
          setError(`Challenge '${challengeId}' not found in Data.json.`);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [challengeId]);

  const togglePopup = () => {
    if (challenge && !error) {
      setPopupVisible(!isPopupVisible);
    }
  };

  const handleSubmit = () => {
    if (triesLeft > 0) {
      console.log("Submitted Answer:", answer);
      setTriesLeft(triesLeft - 1);
      // Here you would add logic to check if the answer is correct
    }
  };

  // Helper function to determine the CSS class for the tries counter
  const getTriesCounterClass = () => {
    if (!challenge) return '';
    if (triesLeft === 0) {
      return 'danger';
    }
    if (triesLeft < challenge.maxTries) {
      return 'warning';
    }
    return ''; // Default class (green)
  };
  
  const renderClickableChest = () => {
    if (isLoading) {
      return <div className="challenge-status-indicator">Loading Challenge...</div>;
    }
    if (error) {
      return <div className="challenge-status-indicator error">{error}</div>;
    }
    return (
      <div className="clickable-svg-wrapper" onClick={togglePopup}>
        <Image 
          src="/clickable-chest.svg" 
          alt="Click to open challenge" 
          width={150} 
          height={150} 
        />
      </div>
    );
  }

  return (
    <div className="challenge-container">
      <div className={`background-content ${isPopupVisible ? 'content-blurred' : ''}`}>
        <Image 
          src="/top-view-map.svg" 
          alt="Challenge Map" 
          layout="fill" 
          objectFit="cover" 
          className="background-svg"
        />
        {renderClickableChest()}
      </div>

      {isPopupVisible && challenge && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="popup-close-button" onClick={togglePopup}>
              &times;
            </button>
            <div className="popup-header">
              <span className="domain-title">{challenge.domain}</span>
              <span className={`tries-counter ${getTriesCounterClass()}`}>
                Attempts left: {triesLeft}/{challenge.maxTries}
              </span>
            </div>
            
            <h2 className="popup-title">{challenge.title}</h2>

            <div className="popup-question-area">
              {challenge.questionType === 'text' ? (
                <div className="popup-question-content">
                  <p className="popup-question-text">{challenge.questionContent}</p>
                </div>
              ) : (
                <div className="popup-question-content">
                  <Image
                    src={challenge.questionContent}
                    alt="Challenge Image"
                    width={400}
                    height={300}
                    className="question-image"
                  />
                </div>
              )}
            </div>

            <div className="popup-answer-area">
              <textarea 
                placeholder="Your answer here, matey..."
                className="popup-answer-textarea"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <div className="popup-footer">
                {challenge.attachment && (
                  <a
                    href={challenge.attachment}
                    download
                    className="popup-attachment-button"
                    aria-label="Download attachment"
                  >
                    <span className="btn-icon">📎</span>
                    <span className="btn-label">Attachment</span>
                  </a>
                )}

                <button
                  className="popup-submit-button"
                  onClick={handleSubmit}
                  disabled={triesLeft === 0}
                  aria-disabled={triesLeft === 0}
                  aria-label="Submit answer"
                >
                  <span className="btn-icon">✔</span>
                  <span className="btn-label">Submit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengePage;