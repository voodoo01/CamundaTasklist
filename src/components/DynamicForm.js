// src/components/DynamicForm.js
import React from 'react';
import { Survey } from 'survey-react-ui';
import 'survey-core/defaultV2.min.css'; // Default SurveyJS theme
import { Model } from 'survey-core';

function DynamicForm({ formSchema, onSubmit }) {
  if (!formSchema) {
    return <p className="text-center text-gray-500">No form schema provided or form is loading...</p>;
  }

  const survey = new Model(formSchema);

  survey.onComplete.add((sender) => {
    onSubmit(sender.data);
  });

  // Optional: You can customize survey behavior here
  // survey.showPreviewBeforeComplete = 'showAnsweredQuestions';

  return <Survey model={survey} />;
}

export default DynamicForm;
